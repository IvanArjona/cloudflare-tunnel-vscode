import * as vscode from "vscode";
import { Subscriber } from "../types";
import { cloudflareTunnelProvider } from "../providers/tunnels";

export class CloudflareTunnelStatusBar implements Subscriber {
  statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this.statusBarItem.command = "cloudflaretunnel.openPanel";
    this.refresh();
    this.showStatusBarItem();
  }

  private showStatusBarItem() {
    const config = vscode.workspace.getConfiguration("cloudflaretunnel.gui");
    const showStatusBarItem = config.get<boolean>("showStatusBarItem", true);
    if (showStatusBarItem) {
      this.statusBarItem.show();
    }
  }

  updateStatusBarItem(
    text: string,
    tooltip: vscode.MarkdownString | null = null
  ) {
    this.statusBarItem.text = `$(cloud) ${text}`;
    this.statusBarItem.tooltip = tooltip || text;
  }

  refresh() {
    const numTunnels = cloudflareTunnelProvider.tunnels.length;
    const text = "Cloudflare Tunnel" + (numTunnels >= 1 ? ` ${numTunnels}` : "");
    const url = "url";
    const hostname = "hostname";
    const tooltip = new vscode.MarkdownString(
      `Cloudflare Tunnel is running\n\nLocal: \`${url}\`\n\nRemote: \`${hostname}\`\n\n[Open in browser](${hostname})`
    );
    this.updateStatusBarItem(text, tooltip);
  }
}

export const cloudflareTunnelStatusBar = new CloudflareTunnelStatusBar();
