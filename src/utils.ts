import * as vscode from "vscode";
import * as constants from "./constants";
import { CloudflareTunnel } from "./tunnel";
import { cloudflareTunnelProvider } from "./providers/tunnels";

export function showErrorMessage(error: unknown) {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  }

  if (typeof error === "string") {
    message = error.toString();
  }

  vscode.window.showErrorMessage(message);
}

export async function showInformationMessage(
  message: string,
  url: string | null = null
) {
  if (url) {
    const action = await vscode.window.showInformationMessage(
      `${message}\n[${url}](${url})`,
      "Copy to clipboard",
      "Open in browser"
    );

    switch (action) {
      case "Copy to clipboard":
        vscode.env.clipboard.writeText(url);
        break;
      case "Open in browser":
        vscode.env.openExternal(vscode.Uri.parse(url));
        break;
    }
  } else {
    await vscode.window.showInformationMessage(message);
  }
}

export function setContext(context: constants.Context, value: unknown) {
  vscode.commands.executeCommand("setContext", context, value);
}

export async function selectRunningTunnel(): Promise<CloudflareTunnel | undefined> {
  const runningTunnels = await cloudflareTunnelProvider.runningTunnels();
  return await vscode.window.showQuickPick<CloudflareTunnel>(runningTunnels);
}

export async function selectRunningTunnelIfUndefined(tunnel?: CloudflareTunnel): Promise<CloudflareTunnel> {
  if (tunnel === undefined) {
    tunnel = await selectRunningTunnel();
    if (!tunnel) {
      return Promise.reject("No tunnel selected");
    }
  }
  return tunnel;
}
