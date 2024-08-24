import * as vscode from "vscode";
import { CloudflaredClient, initCloudflaredClient } from "./cmd/cloudflared";
import { commands } from "./commands/index";
import { cloudflareTunnelProvider } from "./providers/tunnels";
import { LoginStorage } from "./storage/login";

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {
  // Storage
  LoginStorage.init(context);

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

  // Context keys
  vscode.commands.executeCommand("setContext", "cloudflaretunnel.isLoggedIn", isLoggedIn(context));
}

function isLoggedIn(context: vscode.ExtensionContext): boolean {
  const credentialsFile = context.globalState.get<string>("credentialsFile");
  return credentialsFile !== undefined;
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
