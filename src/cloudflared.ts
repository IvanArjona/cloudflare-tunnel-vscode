import * as vscode from "vscode";
import * as fs from "fs";
import { ChildProcess, execFileSync, spawn } from "child_process";

abstract class ExecutableClient {
  protected log: vscode.OutputChannel;

  constructor(private uri: vscode.Uri) {
    this.log = vscode.window.createOutputChannel("Cloudflare Tunnel");
  }

  async exec(args: string[]): Promise<string> {
    const path = this.uri.fsPath;
    try {
      this.log.appendLine(`Exec: ${args.join(" ")}`);
      const stdout = execFileSync(path, args);
      return stdout.toString();
    } catch (error) {
      this.log.appendLine(`Error executing command: ${error}`);
      console.error(error);
      return "";
    }
  }

  async spawn(args: string[]): Promise<ChildProcess> {
    const path = this.uri.fsPath;
    this.log.appendLine(`Spawn: ${args.join(" ")}`);
    return spawn(path, args);
  }
}

export class CloudflaredClient extends ExecutableClient {
  runProcess!: ChildProcess;
  url: string | null = null;
  tunnelName: string;

  constructor(uri: vscode.Uri, private context: vscode.ExtensionContext) {
    super(uri);
    this.context = context;
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
      this.log.appendLine(`Creating tunnel ${this.tunnelName}`);
      await this.exec(command);
    }
    this.log.appendLine(`Tunnel ${this.tunnelName} already exists`);
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
    this.log.appendLine(
      `Creating route dns ${hostname} for tunnel ${this.tunnelName}`
    );
    const response = await this.exec(command);
    console.log(response);
  }

  async start(url: string, hostname: string | undefined): Promise<string> {
    if (await this.isRunning()) {
      await this.stop();
    }

    let command = ["tunnel", "--url", url];
    if (hostname && (await this.isLoggedIn())) {
      command = ["tunnel", "run", "--url", url, this.tunnelName];
    }

    this.runProcess = await this.spawn(command);
    return new Promise((resolve, reject) => {
      if (this.runProcess.stdout && this.runProcess.stderr) {
        this.runProcess.stderr.on("data", (data) => {
          const strData = data.toString();
          const lines = strData.split("\n");
          for (const line of lines) {
            this.log.appendLine(line);
            const [, logLevel, ...extra] = line.split(" ");
            const info = extra
              .filter((word: string) => word && word !== " ")
              .join(" ");
            const hasLink = info.includes(".trycloudflare.com");
            if (hasLink) {
              const link = info
                .split(" ")
                .find((word: string) => word.endsWith(".trycloudflare.com"));
              resolve(link);
              this.url = link;
            }
            if (hostname) {
              const isPropagating = info.includes("registered connIndex");
              if (isPropagating) {
                const url = "https://" + hostname;
                this.url = url;
                resolve(url);
              }
            }
            if (logLevel === "ERR") {
              this.stop();
              reject(info);
            }
          }
        });
      }
    });
  }

  async stop(): Promise<boolean> {
    if (await this.isRunning()) {
      this.url = null;
      return this.runProcess.kill();
    }
    return false;
  }

  async isRunning(): Promise<boolean> {
    return this.runProcess && !this.runProcess.killed;
  }

  async getUrl(): Promise<string | null> {
    return this.url;
  }

  async login() {
    const response = await this.exec(["login"]);
    if (response.includes("You have successfully logged in")) {
      const lines = response.split("\n");
      const credentialsFile = lines.find((line) => line.endsWith(".pem"));
      this.context.globalState.update("credentialsFile", credentialsFile);
    } else if (response.startsWith("You have an existing certificate")) {
      throw new Error(response);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return Boolean(this.context.globalState.get<string>("credentialsFile"));
  }

  async logout() {
    const credentialsFile =
      this.context.globalState.get<string>("credentialsFile");
    if (credentialsFile) {
      fs.unlinkSync(credentialsFile);
    }
    this.context.globalState.update("credentialsFile", undefined);
  }
}
