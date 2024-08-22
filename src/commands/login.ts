import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { showErrorMessage, showInformationMessage } from "../utils";

export async function login(context: vscode.ExtensionContext): Promise<void> {
  try {
    const credentialsFile = await cloudflared.login();
    context.globalState.update("credentialsFile", credentialsFile);
    showInformationMessage("Logged in successfully");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("You have an existing certificate at")
    ) {
      const words = error.message.split(" ");
      const credentialsFile = words.find((word) => word.endsWith(".pem"));
      if (credentialsFile) {
        context.globalState.update("credentialsFile", credentialsFile);
      }
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
      context.globalState.update("credentialsFile", undefined);
      showInformationMessage("Logged out successfully");
    } catch (ex) {
      showErrorMessage(ex);
    }
  } else {
    showErrorMessage("You are not logged in");
  }
}
