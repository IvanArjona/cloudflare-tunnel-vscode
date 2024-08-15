import * as vscode from "vscode";
import type { CloudflareTunnel } from "../tunnel";
import { BaseProvider } from "./base";

export class CloudflareTunnelProvider extends BaseProvider<CloudflareTunnel> {
  private tunnels: CloudflareTunnel[] = [];

  getTreeItem(tunnel: CloudflareTunnel): vscode.TreeItem {
    const item = new vscode.TreeItem(tunnel.port.toString());
    item.description = tunnel.label;
    return item;
  }

  getChildren(tunnel?: CloudflareTunnel): CloudflareTunnel[] {
    console.log(tunnel);
    return this.tunnels;
  }

  addTunnel(tunnel: CloudflareTunnel): void {
    this.tunnels.push(tunnel);
    this.refresh();
  }
}

export const cloudflareTunnelProvider = new CloudflareTunnelProvider();
