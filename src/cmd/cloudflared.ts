import * as vscode from "vscode";
import * as fs from "fs";
import { EventEmitter } from "events";
import { ChildProcess } from "child_process";
import logger from "../logger";
import CloudflaredDownloader from "./downloader";
import { CloudflareTunnel } from "../tunnel";
import ExecutableClient from "./executable";
import * as constants from "../constants";

// eslint-disable-next-line no-use-before-define
export let cloudflared: CloudflaredClient;

export class CloudflaredClient extends ExecutableClient {
  constructor(uri: vscode.Uri) {
    super(uri, constants.cloudflared);
  }

  async version(): Promise<string> {
    return this.exec(["--version"]);
  }

  async createTunnel(tunnel: CloudflareTunnel): Promise<void> {
    const { tunnelName } = tunnel;
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
    this.subscribeForLogs(tunnel.process);
    tunnel.tunnelUri = await this.parseTunnelURI(tunnel);
  }

  private buildStartTunnelCommand(tunnel: CloudflareTunnel): string[] {
    const command = ["tunnel", "--url", tunnel.url];
    if (!tunnel.isQuickTunnel) {
      command.push("run", tunnel.tunnelName);
    }
    return command;
  }

  private subscribeForLogs(process: ChildProcess | undefined) {
    const logOutput = (data: Buffer) => {
      const strData = data.toString();
      const lines = strData.split("\n");
      lines.forEach((line: string) => {
        logger.info(line);
      });
    };
    process?.stdout?.on("data", logOutput);
    process?.stderr?.on("data", logOutput);
  }

  private parseTunnelURI(tunnel: CloudflareTunnel): Promise<string> {
    const process = tunnel.process!;
    return new Promise((resolve, reject) => {
      if (process.stdout && process.stderr) {
        let isCancelled = false;
        let onData: (data: Buffer) => void;
        const cancel = () => {
          if (!isCancelled) {
            process.stderr?.removeListener('data', onData);
          }
          isCancelled = true;
        };

        onData = (data: Buffer) => {
          if (isCancelled) {
            process.stderr?.removeListener('data', onData);
            return;
          }
          const strData = data.toString();
          const lines = strData.split("\n");
          lines.forEach((line: string) => {
            const [, logLevel, ...extra] = line.split(" ");
            const info = extra
              .filter((word: string) => word && word !== " ")
              .join(" ");
            if (info.includes(".trycloudflare.com")) {
              const tunnelUri: string = info
                .split(" ")
                .find((word: string) => word.endsWith(".trycloudflare.com"))!;
              cancel();
              resolve(tunnelUri);
            }
            if (tunnel.hostname && info.includes("connIndex=")) {
              cancel();
              resolve(`https://${tunnel.hostname}`);
            }
            if (logLevel === "ERR") {
              this.stop(tunnel);
              cancel();
              reject(info);
            }
          });
        };

        process.stderr.on("data", onData);
      }
    });
  }

  async stop(tunnel: CloudflareTunnel): Promise<boolean> {
    return this.stopProcess(tunnel.process);
  }

  async login(emitter: EventEmitter): Promise<void> {
    const process = await this.spawn(["login"]);
    if (process.stdout && process.stderr) {
      process.stdout.on("data", (data: Buffer) => {
        const strData = data.toString();
        const lines = strData.split("\n");
        lines.forEach((line: string) => {
          logger.error(line);
          if (line.startsWith("You have an existing certificate")) {
            emitter.emit("error", new Error(line));
            emitter.emit("ended");
          }
        });
      });

      process.stderr.on("data", (data: Buffer) => {
        const strData = data.toString();
        const lines = strData.split("\n");
        lines.forEach((line: string) => {
          logger.info(line);
          if (line.includes(".cloudflare.com")) {
            const loginUrl = new URL(line);
            emitter.emit("loginUrl", loginUrl);
          }
          if (line.endsWith(".pem")) {
            const credentialsFile = line;
            emitter.emit("credentialsFile", credentialsFile);
            emitter.emit("ended");
          }
        });
      });
    }
  }

  async logout(credentialsFile: string): Promise<void> {
    if (credentialsFile) {
      fs.unlinkSync(credentialsFile);
    }
  }

  static async init(
    context: vscode.ExtensionContext
  ): Promise<CloudflaredClient> {
    // Download cloudflared
    const cloudflaredDownloader = new CloudflaredDownloader(context);
    const cloudflaredUri = await cloudflaredDownloader.get();

    // Setup Cloudflared client
    cloudflared = new CloudflaredClient(cloudflaredUri);
    return cloudflared;
  }
}
