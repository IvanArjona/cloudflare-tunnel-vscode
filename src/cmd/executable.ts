import * as vscode from "vscode";
import { logger } from "../logger";
import { ChildProcess, execFileSync, spawn } from "child_process";

export abstract class ExecutableClient {
  constructor(private uri: vscode.Uri, private fileName: string) {}

  private async getPath(): Promise<string> {
    return this.uri.fsPath;
  }

  async exec(args: string[]): Promise<string> {
    const path = await this.getPath();
    try {
      logger.info(`$ ${this.fileName} ${args.join(" ")}`);
      const stdout = execFileSync(path, args).toString();
      logger.info(`> ${stdout}`);
      return stdout;
    } catch (error) {
      logger.error(`Error executing command: ${error}`);
      return "";
    }
  }

  async spawn(args: string[]): Promise<ChildProcess> {
    const path = await this.getPath();
    logger.info(`$$ ${this.fileName} ${args.join(" ")}`);
    return spawn(path, args);
  }

  async isRunningProcess(process: ChildProcess): Promise<boolean> {
    return process && !process.killed;
  }

  async stopProcess(process?: ChildProcess): Promise<boolean> {
    if (process && (await this.isRunningProcess(process))) {
      return process.kill();
    }
    return false;
  }
}
