import * as vscode from "vscode";

enum LogLevel {
  info = "info",
  debug = "debug",
  error = "error",
  warn = "warn",
}

class OutputChannelLogger {
  protected outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("Cloudflare Tunnel");
  }

  private getTimestamp() {
    return new Date().toISOString();
  }

  log(message: string, level: LogLevel): void {
    const timestamp = this.getTimestamp();

    const line = `${timestamp} [${level}] ${message}`;
    this.outputChannel.appendLine(line);

    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }

  info(message: string): void {
    return this.log(message, LogLevel.info);
  }

  debug(message: string): void {
    return this.log(message, LogLevel.debug);
  }

  error(message: string): void {
    return this.log(message, LogLevel.error);
  }

  warn(message: string): void {
    return this.log(message, LogLevel.warn);
  }

  show(): void {
    this.outputChannel.show();
  }
}

const logger = new OutputChannelLogger();

export default logger;
