import * as vscode from "vscode";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";
import { cloudflared } from "../cmd/cloudflared";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import { cloudflareTunnelStatusBar } from "../statusbar/statusbar";
import { showErrorMessage, showInformationMessage } from "../utils";
import { globalState } from "../state/global";
import { config } from "../state/config";
import * as constants from "../constants";

function portValiteInput(value: string): string | undefined {
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
  if (cloudflareTunnelProvider.hasPort(port)) {
    return "Port number is already in use.";
  }
}

async function getPortInput(): Promise<number | null> {
  const response = await vscode.window.showInputBox({
    title: "Port number",
    value: config.defaultPort.toString(),
    prompt: "Select your local port number.",
    ignoreFocusOut: true,
    validateInput: portValiteInput,
  });
  return response ? parseInt(response) : null;
}

function hostnameValiteInput(value: string): string | undefined {
  if (!value) {
    return;
  }
  if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
    return "Invalid hostname. Only alphanumeric characters, dots, and dashes are allowed.";
  }
  if (cloudflareTunnelProvider.hasHostname(value)) {
    return "Hostname is already in use.";
  }
}

async function getHostname(): Promise<string | null> {
  if (globalState.isLoggedIn) {
    return (
      (await vscode.window.showInputBox({
        title: "Hostname",
        value: config.defaultHostname,
        placeHolder: "Enter a hostname",
        ignoreFocusOut: true,
        prompt:
          "Your domain hostname. If not specified anything, it will generate a `.trycloudflare.com` subdomain. Make sure to login and give proper permissions before changing this setting. Example: `mytunnel.mydomain.com`",
        validateInput: hostnameValiteInput,
      })) || null
    );
  }
  return null;
}

export async function createTunnel(): Promise<void> {
  const port = await getPortInput();
  if (!port) {
    return;
  }
  const hostname = await getHostname();

  try {
    const tunnel = new CloudflareTunnel(config.localHostname, port, hostname);

    cloudflareTunnelProvider.addTunnel(tunnel);
    tunnel.subscribe(cloudflareTunnelProvider);
    tunnel.subscribe(cloudflareTunnelStatusBar);

    try {
      await vscode.window.withProgress<void>(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Starting cloudflare tunnel for ${tunnel.url}. [(Show logs)](command:${constants.Commands.openOutputChannel})\n`,
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            cloudflared.stop(tunnel);
            cloudflareTunnelProvider.removeTunnel(tunnel);
          });

          if (hostname) {
            progress.report({ message: "Creating tunnel..." });
            await cloudflared.createTunnel(tunnel);
            progress.report({ message: "Creating route dns..." });
            await cloudflared.routeDns(tunnel);
          }
          progress.report({ message: "Starting tunnel..." });
          await cloudflared.startTunnel(tunnel);
        }
      );

      tunnel.status = CloudflareTunnelStatus.running;

      await showInformationMessage(
        "Your Cloudflare Tunnel has been created!",
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
