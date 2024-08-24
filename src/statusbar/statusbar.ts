import * as vscode from "vscode";
import { Subscriber } from "../types";
import { cloudflareTunnelProvider } from "../providers/tunnels";
import { config } from "../state/config";
import * as constants from "../constants";

export class CloudflareTunnelStatusBar implements Subscriber {
  statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER
    );
    this.statusBarItem.command = constants.Commands.openPanel;
    this.refresh();
    this.showStatusBarItem();
  }

  private showStatusBarItem() {
    if (config.showStatusBarItem) {
      this.statusBarItem.show();
    }
  }

  refresh() {
    const tunnels = cloudflareTunnelProvider.tunnels;
    const numTunnels = cloudflareTunnelProvider.runningTunnels().length;
    const text =
      "Cloudflare Tunnel" + (numTunnels >= 1 ? ` ${numTunnels}` : "");
    const tooltipText = tunnels
      .map((tunnel) => {
        return (
          tunnel.url +
          (tunnel.status === "Running"
            ? `\t $(cloud) [${tunnel.shortTunnelUri}](${tunnel.tunnelUri})`
            : "")
        );
      })
      .join("\n\n---\n\n");
    const tooltip = new vscode.MarkdownString(tooltipText, true);

    this.statusBarItem.text = `$(cloud) ${text}`;
    this.statusBarItem.tooltip = tooltip || text;
  }
}

export const cloudflareTunnelStatusBar = new CloudflareTunnelStatusBar();
