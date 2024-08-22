import * as vscode from "vscode";
import * as fs from "fs";
import { logger } from "../logger";
import { CloudflaredDownloader } from "./downloader";
import { CloudflareTunnel } from "../tunnel";
import { ExecutableClient } from "./executable";

export class CloudflaredClient extends ExecutableClient {
  constructor(uri: vscode.Uri) {
    super(uri, "cloudflared");
  }

  async version(): Promise<string> {
    return await this.exec(["--version"]);
  }

  async createTunnel(tunnel: CloudflareTunnel): Promise<void> {
    const tunnelName = tunnel.tunnelName;
    const tunnels = await this.exec(["tunnel", "list"]);
    if (!tunnels.includes(tunnelName)) {
      logger.info(`Creating tunnel ${tunnelName}`);
      await this.exec(["tunnel", "create", tunnelName]);
    }
    logger.info(`Tunnel ${tunnelName} already exists`);
  }

  async deleteTunnel(tunnel: CloudflareTunnel): Promise<void> {
    await this.exec(["tunnel", "delete", "-f", tunnel.tunnelName]);
  }

  async routeDns(tunnel: CloudflareTunnel): Promise<void> {
    const command = [
      "tunnel",
      "route",
      "dns",
      "--overwrite-dns",
      tunnel.tunnelName,
      tunnel.hostname!,
    ];
    logger.info(
      `Creating route dns ${tunnel.hostname} for tunnel ${tunnel.tunnelName}`
    );
    await this.exec(command);
  }

  async startTunnel(tunnel: CloudflareTunnel): Promise<void> {
    const command = this.buildStartTunnelCommand(tunnel);
    tunnel.process = await this.spawn(command);
    tunnel.tunnelUri = await this.handleStartTunnelProcess(tunnel);
  }

  private buildStartTunnelCommand(tunnel: CloudflareTunnel): string[] {
    const command = ["tunnel", "--url", tunnel.url];
    if (!tunnel.isQuickTunnel) {
      command.push("run", tunnel.tunnelName);
    }
    return command;
  }

  private handleStartTunnelProcess(tunnel: CloudflareTunnel): Promise<string> {
    const process = tunnel.process!;
    return new Promise((resolve, reject) => {
      if (process.stdout && process.stderr) {
        process.stderr.on("data", (data) => {
          const strData = data.toString();
          const lines = strData.split("\n");
          for (const line of lines) {
            logger.info(line);
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
            if (tunnel.hostname && info.includes("connIndex=")) {
              resolve(`https://${tunnel.hostname}`);
            }
            if (logLevel === "ERR") {
              this.stop(tunnel);
              reject(info);
            }
          }
        });
      }
    });
  }

  async stop(tunnel: CloudflareTunnel): Promise<boolean> {
    return await this.stopProcess(tunnel.process);
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
