import { CloudflareTunnel, CloudflareTunnelStatus } from './tunnel';
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

async function start(cloudflared: CloudflaredClient) {
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
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    cloudflareTunnelProvider.addTunnel(tunnel);

    const tunnelUri = await cloudflared.start(url, hostname);
    tunnel.tunnelUri = tunnelUri;
    tunnel.status = CloudflareTunnelStatus.running;

    await showInformationMessage(
      "Your quick Tunnel has been created!",
      tunnelUri
    );
  } catch (ex) {
    showErrorMessage(ex);
  }
}

async function stop(cloudflared: CloudflaredClient) {
  await cloudflared.stop();

  const message = "Cloudflare tunnel stopped";
  showInformationMessage(message);
}

async function isRunning(cloudflared: CloudflaredClient) {
  const response = await cloudflared.isRunning();
  const message = `Cloudflare tunnel is${response ? "" : " not"} running`;
  showInformationMessage(message);
}

async function getUrl(cloudflared: CloudflaredClient) {
  const url = await cloudflared.getUrl();
  const message = `Cloudflare tunnel is${url ? "" : " not"} running`;
  showInformationMessage(message, url);
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

const commands = [openPanel, version, start, stop, isRunning, getUrl, login, logout];

export default commands;
