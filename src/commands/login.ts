import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { showErrorMessage, showInformationMessage } from "../utils";

function updateCredentialsFile(context: vscode.ExtensionContext, credentialsFile?: string): void {
  context.globalState.update("credentialsFile", credentialsFile);
  vscode.commands.executeCommand(
    "setContext",
    "cloudflaretunnel.isLoggedIn",
    credentialsFile !== undefined
  );
}

export async function login(context: vscode.ExtensionContext): Promise<void> {
  try {
    const credentialsFile = await cloudflared.login();
    updateCredentialsFile(context, credentialsFile);
    showInformationMessage("Logged in successfully");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("You have an existing certificate at")
    ) {
      const words = error.message.split(" ");
      const credentialsFile = words.find((word) => word.endsWith(".pem"));
      updateCredentialsFile(context, credentialsFile);
    }
    showErrorMessage(error);
  }
}

export async function logout(context: vscode.ExtensionContext): Promise<void> {
  const credentialsFile = context.globalState.get<string>("credentialsFile");
  const isLoggedIn = credentialsFile !== undefined;

  if (isLoggedIn) {
    try {
      await cloudflared.logout(credentialsFile);
      showInformationMessage("Logged out successfully");
    } catch (ex) {
      showErrorMessage(ex);
    }
  } else {
    showErrorMessage("You are not logged in");
  }

  updateCredentialsFile(context);
}
