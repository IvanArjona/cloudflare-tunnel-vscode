import * as vscode from "vscode";

export class LoginStorage {
  storage: vscode.Memento;

  constructor(context: vscode.ExtensionContext) {
    this.storage = context.globalState;
  }

  get credentialsFile(): string | undefined {
    return this.storage.get<string>("credentialsFile");
  }

  set credentialsFile(value: string | undefined) {
    this.storage.update("credentialsFile", value);
    this.setIsLoggedInContext(this.isLoggedIn);
  }

  get isLoggedIn(): boolean {
    return this.credentialsFile !== undefined;
  }

  setIsLoggedInContext(value: boolean): void {
    vscode.commands.executeCommand(
      "setContext",
      "cloudflaretunnel.isLoggedIn",
      value
    );
  }

  static init(context: vscode.ExtensionContext): LoginStorage {
    loginStorage = new LoginStorage(context);
    return loginStorage;
  }
}

export let loginStorage: LoginStorage;
