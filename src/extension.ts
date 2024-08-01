import * as vscode from "vscode";
import { CloudflaredClient } from "./cloudflared";
import { CloudflaredDownloader } from "./downloader";
import commands from "./commands";

let cloudflared: CloudflaredClient;

export async function activate(context: vscode.ExtensionContext) {
  // Download cloudflared
  const cloudflaredDownloader = new CloudflaredDownloader(context);
  const cloudflaredUri = await cloudflaredDownloader.get();

  // Setup Cloudflared client
  cloudflared = new CloudflaredClient(cloudflaredUri, context);

  // Activate commands
  for (const callable of commands) {
    const callback = async () => callable(cloudflared);
    const command = vscode.commands.registerCommand(
      `cloudflaretunnel.${callable.name}`,
      callback
    );
    context.subscriptions.push(command);
  }
}

// this method is called when your extension is deactivated
export async function deactivate() {
  await cloudflared.stop();
}
