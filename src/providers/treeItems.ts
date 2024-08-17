import * as vscode from "vscode";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";

export abstract class TreeItem extends vscode.TreeItem {
  public children: CloudflareTunnelTreeItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export class CloudflareTunnelTreeItem extends TreeItem {
  constructor(public tunnel: CloudflareTunnel) {
    const collapsibleState =
      tunnel.status === CloudflareTunnelStatus.running
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None;

    super(tunnel.port.toString(), collapsibleState);

    this.description = tunnel.label;
    this.contextValue = tunnel.status;

    if (tunnel.status === CloudflareTunnelStatus.running) {
      const uriTreeItem = new CloudflareTunnelUriTreeItem(tunnel);
      this.children.push(uriTreeItem);
    }
  }
}

export class CloudflareTunnelUriTreeItem extends TreeItem {
  constructor(public tunnel: CloudflareTunnel) {
    super(tunnel.tunnelUri, vscode.TreeItemCollapsibleState.None);
    this.contextValue = tunnel.status;
  }
}
