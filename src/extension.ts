import * as vscode from "vscode";
import { CloudflaredClient, initCloudflaredClient } from "./cloudflared";
import commands from "./commands";
import { cloudflareTunnelProvider } from "./providers/tunnels";

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {
  // Setup Cloudflared client
  cloudflared = await initCloudflaredClient(context);

  // Activate commands
  for (let callback of commands) {
    const commandId = `cloudflaretunnel.${callback.name}`;
    callback = callback.bind(null, context);
    const command = vscode.commands.registerCommand(commandId, callback);
    context.subscriptions.push(command);
  }

  // Register providers
  vscode.window.registerTreeDataProvider(
    "cloudflaretunnel.list",
    cloudflareTunnelProvider
  );
}

// this method is called when your extension is deactivated
export async function deactivate() {
  const tunnels = cloudflareTunnelProvider.tunnels;
  for (const tunnel of tunnels) {
    if (tunnel.process) {
      await cloudflared.stop(tunnel);
    }
    if (!tunnel.isQuickTunnel) {
      await cloudflared.deleteTunnel(tunnel);
    }
  }
}
