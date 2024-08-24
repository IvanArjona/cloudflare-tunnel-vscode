import * as vscode from "vscode";
import * as constants from "../constants";
import { ConfigItem } from "../types";

export class Config {
  config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration(constants.configSection);
  }

  get defaultPort(): number {
    return this.get<number>(constants.config.defaultPort);
  }

  get defaultHostname(): string {
    return this.get<string>(constants.config.defaultHostname);
  }

  get localHostname(): string {
    return this.get<string>(constants.config.localHostname);
  }

  get showStatusBarItem(): boolean {
    return this.get<boolean>(constants.config.showStatusBarItem);
  }

  get<T>(configItem: ConfigItem): T {
    return this.config.get<T>(configItem.key, configItem.default as T);
  }
}

export const config = new Config();
