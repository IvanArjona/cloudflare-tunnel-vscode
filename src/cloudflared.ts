import * as vscode from "vscode";
import * as fs from "fs";
import { ChildProcess, execFileSync, spawn } from "child_process";
import { OutputChannelLogger } from "./logger";
import { CloudflaredDownloader } from "./downloader";
import { CloudflareTunnel } from "./tunnel";

abstract class ExecutableClient {
  protected logger: OutputChannelLogger;

  constructor(private uri: vscode.Uri, private fileName: string) {
    this.logger = new OutputChannelLogger();
  }

  async exec(args: string[]): Promise<string> {
    const path = this.uri.fsPath;
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
    const path = this.uri.fsPath;
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
    const listCommand = ["tunnel", "list"];
    const tunnels = await this.exec(listCommand);
    if (!tunnels.includes(this.tunnelName)) {
      const command = ["tunnel", "create", this.tunnelName];
      this.logger.info(`Creating tunnel ${this.tunnelName}`);
      await this.exec(command);
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
    const response = await this.exec(command);
    console.log(response);
  }

  async startTunnel(
    tunnel: CloudflareTunnel,
    credentialsFile: string | null
  ): Promise<[ChildProcess, string]> {
    const url = tunnel.url;
    const hostname = tunnel.hostname;

    let command = ["tunnel", "--url", url];
    if (hostname && credentialsFile) {
      command = [
        "tunnel",
        "run",
        "--url",
        url,
        "--origincert",
        credentialsFile,
        this.tunnelName,
      ];
    }

    const process: ChildProcess = await this.spawn(command);
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
            const hasLink = info.includes(".trycloudflare.com");
            if (hasLink) {
              const link = info
                .split(" ")
                .find((word: string) => word.endsWith(".trycloudflare.com"));
              resolve([process, link]);
            }
            if (hostname) {
              const isPropagating = info.includes("registered connIndex");
              if (isPropagating) {
                const url = "https://" + hostname;
                resolve([process, url]);
              }
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
