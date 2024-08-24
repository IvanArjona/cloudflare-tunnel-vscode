/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { showErrorMessage, showInformationMessage } from "../utils";
import { globalState } from "../state/global";

export async function login(context: vscode.ExtensionContext): Promise<void> {
  try {
    const credentialsFile = await cloudflared.login();
    globalState.credentialsFile = credentialsFile;
    showInformationMessage("Logged in successfully");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("You have an existing certificate at")
    ) {
      const words = error.message.split(" ");
      const credentialsFile = words.find((word) => word.endsWith(".pem"));
      globalState.credentialsFile = credentialsFile;
    }
    showErrorMessage(error);
  }
}

export async function logout(context: vscode.ExtensionContext): Promise<void> {
  globalState.isLoggedIn;

  if (globalState.isLoggedIn) {
    try {
      await cloudflared.logout(globalState.credentialsFile!);
      showInformationMessage("Logged out successfully");
    } catch (ex) {
      showErrorMessage(ex);
    }
  } else {
    showErrorMessage("You are not logged in");
  }

  globalState.credentialsFile = undefined;
}
