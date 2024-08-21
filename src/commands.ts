/* eslint-disable @typescript-eslint/no-unused-vars */
import { CloudflareTunnel, CloudflareTunnelStatus } from "./tunnel";
import * as vscode from "vscode";
import { cloudflared } from "./cloudflared";
import { cloudflareTunnelStatusBar } from "./statusbar/statusbar";
import { showErrorMessage, showInformationMessage } from "./utils";
import { cloudflareTunnelProvider } from "./providers/tunnels";
import { Command } from "./types";
import { logger } from "./logger";

async function openPanel(context: vscode.ExtensionContext) {
  await vscode.commands.executeCommand("cloudflaretunnel.list.focus");
}

async function openOutputChannel(context: vscode.ExtensionContext) {
  logger.show();
}

async function version(context: vscode.ExtensionContext): Promise<void> {
  const message = await cloudflared.version();
  showInformationMessage(message);
}

async function createTunnel(context: vscode.ExtensionContext): Promise<void> {
  // Configuration
  const config = vscode.workspace.getConfiguration("cloudflaretunnel.tunnel");
  const defaultPort = config.get<number>("defaultPort", 8080);
  const defaultHostname = config.get<string>("defaultHostname", "");
  const localHostname = config.get<string>("localHostname", "localhost");
  const credentialsFile =
    context.globalState.get<string | null>("credentialsFile", null);
  const isLoggedIn = credentialsFile !== undefined;
  let port = defaultPort;
  let hostname = null;

  // Port input
  const inputResponse = await vscode.window.showInputBox({
    title: "Port number",
    value: defaultPort.toString(),
    prompt: "Select your local port number.",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (!value) {
        return;
      }
      const port = parseInt(value);
      if (!port) {
        return "Please enter a valid port number.";
      }
      if (port < 1 || port > 65535) {
        return "Port number must be between 1 and 65535.";
      }
    }
  }) || defaultPort.toString();
  if (!inputResponse) {
    return;
  }
  port = inputResponse ? parseInt(inputResponse) : defaultPort;

  // Hostname input
  if (isLoggedIn) {
    hostname = await vscode.window.showInputBox({
      title: "Hostname",
      value: defaultHostname,
      placeHolder: "Enter a hostname",
      ignoreFocusOut: true,
      prompt:
        "Your domain hostname. If not specified anything, it will generate a `.trycloudflare.com` subdomain. Make sure to login and give proper permissions before changing this setting. Example: `mytunnel.mydomain.com`",
      validateInput: (value: string) => {
        if (!value) {
          return;
        }
        if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
          return "Invalid hostname. Only alphanumeric characters, dots, and dashes are allowed.";
        }
      }
    }) || null;
  }

  try {
    const tunnel = new CloudflareTunnel(localHostname, port, hostname);

    if (hostname) {
      await cloudflared.createTunnel(tunnel);
      await cloudflared.routeDns(tunnel);
    }

    cloudflareTunnelProvider.addTunnel(tunnel);
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    try {
      await cloudflared.startTunnel(tunnel);
      tunnel.status = CloudflareTunnelStatus.running;

      await showInformationMessage(
        "Your quick Tunnel has been created!",
        tunnel.tunnelUri
      );
    } catch (ex) {
      cloudflareTunnelProvider.removeTunnel(tunnel);
      showErrorMessage(ex);
    }
  } catch (ex) {
    showErrorMessage(ex);
  }
}

async function stopTunnel(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  await cloudflared.stop(tunnel);
  await cloudflared.deleteTunnel(tunnel);

  cloudflareTunnelProvider.removeTunnel(tunnel);

  const message = "Cloudflare tunnel stopped";
  showInformationMessage(message);
}

async function openTunnelExternal(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  const uri = vscode.Uri.parse(tunnel.tunnelUri);
  const externalUri = await vscode.env.asExternalUri(uri);
  await vscode.env.openExternal(externalUri);
}

async function copyTunnelUriToClipboard(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  console.log(cloudflared);
  vscode.env.clipboard.writeText(tunnel.tunnelUri);
}

async function login(context: vscode.ExtensionContext): Promise<void> {
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

async function logout(context: vscode.ExtensionContext): Promise<void> {
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

const commands: Command[] = [
  openPanel,
  openOutputChannel,
  version,
  createTunnel,
  stopTunnel,
  openTunnelExternal,
  copyTunnelUriToClipboard,
  login,
  logout,
];

export default commands;
