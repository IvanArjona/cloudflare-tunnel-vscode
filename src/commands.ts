/* eslint-disable @typescript-eslint/no-unused-vars */
import { CloudflareTunnel, CloudflareTunnelStatus } from "./tunnel";
import * as vscode from "vscode";
import { cloudflared } from "./cloudflared";
import { cloudflareTunnelStatusBar } from "./statusbar/statusbar";
import { showErrorMessage, showInformationMessage } from "./utils";
import { cloudflareTunnelProvider } from "./providers/tunnels";
import { Command } from "./types";

async function openPanel(context: vscode.ExtensionContext) {
  await vscode.commands.executeCommand("cloudflaretunnel.list.focus");
}

async function version(context: vscode.ExtensionContext): Promise<void> {
  const message = await cloudflared.version();
  showInformationMessage(message);
}

async function createTunnel(context: vscode.ExtensionContext): Promise<void> {
  // Configuration
  const config = vscode.workspace.getConfiguration("cloudflaretunnel.tunnel");
  const defaultPort = config.get<number>("defaultPort", 8080);
  const hostname = config.get<string>("hostname") || null;
  const localHostname = config.get<string>("localHostname", "localhost");
  let port = defaultPort;

  // Port input
  const inputResponse = await vscode.window.showInputBox({
    title: "Port number",
    placeHolder: `Select a port. Default: ${defaultPort}`,
    ignoreFocusOut: true,
  });
  if (!inputResponse) {
    return;
  }
  port = inputResponse ? parseInt(inputResponse) : defaultPort;

  try {
    if (hostname) {
      await cloudflared.createTunnel();
      await cloudflared.routeDns(hostname);
    }

    const tunnel = new CloudflareTunnel(localHostname, port, hostname);
    cloudflareTunnelProvider.addTunnel(tunnel);
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    try {
      const credentialsFile = context.globalState.get<string>("credentialsFile") || null;
      const [process, tunnelUri] = await cloudflared.startTunnel(
        tunnel,
        credentialsFile
      );
      tunnel.process = process;
      tunnel.tunnelUri = tunnelUri;
      tunnel.status = CloudflareTunnelStatus.running;

      await showInformationMessage(
        "Your quick Tunnel has been created!",
        tunnelUri
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
  const process = tunnel.process;
  if (!process) {
    showErrorMessage("Tunnel is not running");
    return;
  }
  await cloudflared.stop(process);
  cloudflareTunnelProvider.removeTunnel(tunnel);

  const message = "Cloudflare tunnel stopped";
  showInformationMessage(message);
}

async function openTunnelExternal(
  context: vscode.ExtensionContext,
  tunnel: CloudflareTunnel
): Promise<void> {
  const uri = vscode.Uri.parse(tunnel.tunnelUri);
  vscode.env.openExternal(uri);
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
  version,
  createTunnel,
  stopTunnel,
  openTunnelExternal,
  copyTunnelUriToClipboard,
  login,
  logout,
];

export default commands;
