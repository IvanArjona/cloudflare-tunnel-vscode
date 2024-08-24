import * as vscode from "vscode";
import { CloudflaredClient } from "./cmd/cloudflared";
import { commands } from "./commands/index";
import { cloudflareTunnelProvider } from "./providers/tunnels";
import { GlobalState } from "./state/global";

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {
  // State
  const globalState = GlobalState.init(context);

  // Setup Cloudflared client
  cloudflared = await CloudflaredClient.init(context);

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

  // Context keys
  vscode.commands.executeCommand("setContext", "cloudflaretunnel.isLoggedIn", globalState.isLoggedIn);
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
