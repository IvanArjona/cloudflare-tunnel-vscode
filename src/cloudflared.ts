import * as vscode from "vscode";
import * as fs from "fs";
import { ChildProcess, execFileSync, spawn } from "child_process";
import { OutputChannelLogger } from "./logger";
import { CloudflaredDownloader } from "./downloader";
import { CloudflareTunnel } from "./tunnel";

abstract class ExecutableClient {
  protected logger: OutputChannelLogger;

  constructor(private uri: vscode.Uri, private fileName: string) {
    this.logger = this.initializeLogger();
  }

  private initializeLogger(): OutputChannelLogger {
    return new OutputChannelLogger();
  }

  private async getPath(): Promise<string> {
    return this.uri.fsPath;
  }

  async exec(args: string[]): Promise<string> {
    const path = await this.getPath();
    try {
      this.logger.info(`$ ${this.fileName} ${args.join(" ")}`);
      const stdout = execFileSync(path, args).toString();
      this.logger.info(`> ${stdout}`);
      return stdout;
    } catch (error) {
      this.logger.error(`Error executing command: ${error}`);
      return "";
    }
  }

  async spawn(args: string[]): Promise<ChildProcess> {
    const path = await this.getPath();
    this.logger.info(`$$ ${this.fileName} ${args.join(" ")}`);
    return spawn(path, args);
  }
}

export class CloudflaredClient extends ExecutableClient {
  tunnelName: string;

  constructor(uri: vscode.Uri) {
    super(uri, "cloudflared");
    this.tunnelName = "cloudflare-tunnel-vscode";
  }

  async version(): Promise<string> {
    return await this.exec(["--version"]);
  }

  async createTunnel(): Promise<void> {
    const tunnels = await this.exec(["tunnel", "list"]);
    if (!tunnels.includes(this.tunnelName)) {
      this.logger.info(`Creating tunnel ${this.tunnelName}`);
      await this.exec(["tunnel", "create", this.tunnelName]);
    }
    this.logger.info(`Tunnel ${this.tunnelName} already exists`);
  }

  async routeDns(hostname: string): Promise<void> {
    const command = [
      "tunnel",
      "route",
      "dns",
      "--overwrite-dns",
      this.tunnelName,
      hostname,
    ];
    this.logger.info(
      `Creating route dns ${hostname} for tunnel ${this.tunnelName}`
    );
    await this.exec(command);
  }

  async startTunnel(tunnel: CloudflareTunnel): Promise<[ChildProcess, string]> {
    const command = this.buildStartTunnelCommand(tunnel);
    const process = await this.spawn(command);
    const tunnelUri = await this.handleStartTunnelProcess(
      process,
      tunnel.hostname
    );
    return [process, tunnelUri];
  }

  private buildStartTunnelCommand(tunnel: CloudflareTunnel): string[] {
    const command = ["tunnel", "--url", tunnel.url];
    if (!tunnel.isQuickTunnel) {
      command.push("run", this.tunnelName);
    }
    return command;
  }

  private handleStartTunnelProcess(
    process: ChildProcess,
    hostname: string | null
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (process.stdout && process.stderr) {
        process.stderr.on("data", (data) => {
          const strData = data.toString();
          const lines = strData.split("\n");
          for (const line of lines) {
            this.logger.info(line);
            const [, logLevel, ...extra] = line.split(" ");
            const info = extra
              .filter((word: string) => word && word !== " ")
              .join(" ");
            if (info.includes(".trycloudflare.com")) {
              const tunnelUri = info
                .split(" ")
                .find((word: string) => word.endsWith(".trycloudflare.com"));
              resolve(tunnelUri);
            }
            if (hostname && info.includes("connIndex=")) {
              resolve(`https://${hostname}`);
            }
            if (logLevel === "ERR") {
              this.stop(process);
              reject(info);
            }
          }
        });
      }
    });
  }

  async stop(process: ChildProcess): Promise<boolean> {
    if (await this.isRunning(process)) {
      return process.kill();
    }
    return false;
  }

  async isRunning(process: ChildProcess): Promise<boolean> {
    return process && !process.killed;
  }

  async login(): Promise<string> {
    const response = await this.exec(["login"]);
    if (response.includes("You have successfully logged in")) {
      const lines = response.split("\n");
      const credentialsFile = lines.find((line) => line.endsWith(".pem"));
      if (!credentialsFile) {
        throw new Error("Credentials file not found");
      }
      return credentialsFile;
    } else if (response.startsWith("You have an existing certificate")) {
      throw new Error(response);
    }
    throw new Error("Login failed");
  }

  async logout(credentialsFile: string): Promise<void> {
    if (credentialsFile) {
      fs.unlinkSync(credentialsFile);
    }
  }
}

export let cloudflared: CloudflaredClient;

export async function initCloudflaredClient(
  context: vscode.ExtensionContext
): Promise<CloudflaredClient> {
  // Download cloudflared
  const cloudflaredDownloader = new CloudflaredDownloader(context);
  const cloudflaredUri = await cloudflaredDownloader.get();

  // Setup Cloudflared client
  cloudflared = new CloudflaredClient(cloudflaredUri);
  return cloudflared;
}
