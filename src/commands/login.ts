/* eslint-disable @typescript-eslint/no-unused-vars */
import * as vscode from "vscode";
import { cloudflared } from "../cmd/cloudflared";
import { showErrorMessage, showInformationMessage } from "../utils";
import { loginStorage } from "../storage/login";

export async function login(context: vscode.ExtensionContext): Promise<void> {
  try {
    const credentialsFile = await cloudflared.login();
    loginStorage.credentialsFile = credentialsFile;
    showInformationMessage("Logged in successfully");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("You have an existing certificate at")
    ) {
      const words = error.message.split(" ");
      const credentialsFile = words.find((word) => word.endsWith(".pem"));
      loginStorage.credentialsFile = credentialsFile;
    }
    showErrorMessage(error);
  }
}

export async function logout(context: vscode.ExtensionContext): Promise<void> {
  loginStorage.isLoggedIn;

  if (loginStorage.isLoggedIn) {
    try {
      await cloudflared.logout(loginStorage.credentialsFile!);
      showInformationMessage("Logged out successfully");
    } catch (ex) {
      showErrorMessage(ex);
    }
  } else {
    showErrorMessage("You are not logged in");
  }

  loginStorage.credentialsFile = undefined;
}
