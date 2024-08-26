import * as vscode from "vscode";
import { EventEmitter, once } from "events";
import { cloudflared } from "../cmd/cloudflared";
import { showErrorMessage, showInformationMessage } from "../utils";
import { globalState } from "../state/global";

async function doLogin(
  progress: vscode.Progress<{ message?: string }>
): Promise<void> {
  const loginEmitter = new EventEmitter();

  loginEmitter.on("loginUrl", (loginUrl: URL) => {
    progress.report({
      message: `A browser window should have opened in your browser. [Open again](${loginUrl}).`,
    });
  });

  loginEmitter.on("credentialsFile", (credentialsFile: string) => {
    globalState.credentialsFile = credentialsFile;
    const message = `Logged in successfully. Credentials file: ${credentialsFile}`;
    progress.report({ message });
    showInformationMessage(message);
  });

  loginEmitter.on("error", (error: Error) => {
    if (
      error instanceof Error &&
      error.message.startsWith("You have an existing certificate at")
    ) {
      const words = error.message.split(" ");
      const credentialsFile = words.find((word) => word.endsWith(".pem"));
      loginEmitter.emit("credentialsFile", credentialsFile);
    } else {
      showErrorMessage(error);
    }
  });

  await cloudflared.login(loginEmitter);
  await once(loginEmitter, "ended");
}

export async function login(): Promise<void> {
  await vscode.window.withProgress<void>(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Logging in...",
      cancellable: true,
    },
    doLogin
  );
}

export async function logout(): Promise<void> {
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
