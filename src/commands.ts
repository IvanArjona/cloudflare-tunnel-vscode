import { CloudflareTunnel, CloudflareTunnelStatus } from "./tunnel";
import * as vscode from "vscode";
import { CloudflaredClient } from "./cloudflared";
import { cloudflareTunnelStatusBar } from "./statusbar/statusbar";
import { showErrorMessage, showInformationMessage } from "./utils";
import { cloudflareTunnelProvider } from "./providers/tunnels";

async function openPanel(cloudflared: CloudflaredClient) {
  console.log(cloudflared);
  await vscode.commands.executeCommand("cloudflaretunnel.list.focus");
}

async function version(cloudflared: CloudflaredClient) {
  const message = await cloudflared.version();
  showInformationMessage(message);
}

async function createTunnel(cloudflared: CloudflaredClient) {
  // Configuration
  const config = vscode.workspace.getConfiguration("cloudflaretunnel.tunnel");
  const defaultPort = config.get<number>("defaultPort", 8080);
  const hostname = config.get<string>("hostname");
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
    const url = `${localHostname}:${port}`;
    if (hostname) {
      await cloudflared.createTunnel();
      await cloudflared.routeDns(hostname);
    }

    const tunnel = new CloudflareTunnel(hostname || localHostname, port);
    cloudflareTunnelProvider.addTunnel(tunnel);
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    try {
      const [process, tunnelUri] = await cloudflared.start(url, hostname);
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

async function stopTunnel(cloudflared: CloudflaredClient, tunnel: CloudflareTunnel) {
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

async function openTunnelExternal(cloudflared: CloudflaredClient, tunnel: CloudflareTunnel) {
  const uri = vscode.Uri.parse(tunnel.tunnelUri);
  vscode.env.openExternal(uri);
}

async function copyTunnelUriToClipboard(cloudflared: CloudflaredClient, tunnel: CloudflareTunnel) {
  console.log(cloudflared);
  vscode.env.clipboard.writeText(tunnel.tunnelUri);
}

async function login(cloudflared: CloudflaredClient) {
  try {
    await cloudflared.login();
    showInformationMessage("Logged in successfully");
  } catch (ex) {
    showErrorMessage(ex);
  }
}

async function logout(cloudflared: CloudflaredClient) {
  const isLoggedIn = await cloudflared.isLoggedIn();

  if (isLoggedIn) {
    try {
      await cloudflared.logout();
      showInformationMessage("Logged out successfully");
    } catch (ex) {
      showErrorMessage(ex);
    }
  } else {
    showErrorMessage("You are not logged in");
  }
}

const commands = [
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
