import * as vscode from "vscode";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";

export class CloudflareTunnelTreeItem extends vscode.TreeItem {
  constructor(public tunnel: CloudflareTunnel) {
    super(tunnel.label, vscode.TreeItemCollapsibleState.None);
  }

  override description: string = this.tunnel.description;
  override contextValue: string = this.tunnel.status;

  // @ts-expect-error: TS2611
  override get iconPath(): vscode.ThemeIcon {
    if (this.tunnel.status === CloudflareTunnelStatus.starting) {
      return new vscode.ThemeIcon("sync~spin");
    }

    const runningIconColor = new vscode.ThemeColor("charts.orange");
    return new vscode.ThemeIcon("cloud", runningIconColor);
  }

  // @ts-expect-error: TS2611
  override get tooltip(): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`\n\n**Local**: [http://${this.tunnel.url}](${this.tunnel.url})`);
    tooltip.appendMarkdown(`\n\n**Tunnel**: [${this.tunnel.shortTunnelUri}](${this.tunnel.tunnelUri})`);
    tooltip.appendMarkdown(`\n\n**Status**: ${this.tunnel.status}`);
    if (this.tunnel.isQuickTunnel) {
      tooltip.appendText('\n\nQuick Tunnel');
    } else {
      tooltip.appendMarkdown(`\n\n**Tunnel name**: ${this.tunnel.tunnelName}`);
    }
    return tooltip;
  }
}
