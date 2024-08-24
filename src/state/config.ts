import * as vscode from "vscode";

export class Config {
  config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration("cloudflaretunnel.tunnel");
  }

  get defaultPort(): number {
    return this.config.get<number>("defaultPort", 8080);
  }

  get defaultHostname(): string {
    return this.config.get<string>("defaultHostname", "");
  }

  get localHostname(): string {
    return this.config.get<string>("localHostname", "localhost");
  }

  get showStatusBarItem(): boolean {
    return this.config.get<boolean>("showStatusBarItem", true);
  }
}

export const config = new Config();
