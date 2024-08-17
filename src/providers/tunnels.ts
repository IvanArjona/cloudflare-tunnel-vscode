import { CloudflareTunnel } from "../tunnel";
import { TreeItem, CloudflareTunnelTreeItem } from "./treeItems";
import { BaseProvider } from "./base";
import { Subscriber } from "../types";

export class CloudflareTunnelProvider
  extends BaseProvider<CloudflareTunnel>
  implements Subscriber
{
  private tunnels: CloudflareTunnel[] = [];

  getTreeItem(tunnel: CloudflareTunnel | TreeItem): TreeItem {
    if (tunnel instanceof CloudflareTunnel) {
      return new CloudflareTunnelTreeItem(tunnel);
    }
    return tunnel;
  }

  getChildren(tunnel?: TreeItem): CloudflareTunnel[] | TreeItem[] {
    if (tunnel) {
      const treeItem = this.getTreeItem(tunnel);
      return treeItem.children;
    }
    return this.tunnels;
  }

  addTunnel(tunnel: CloudflareTunnel): void {
    this.tunnels.push(tunnel);
    this.refresh();
  }
}

export const cloudflareTunnelProvider = new CloudflareTunnelProvider();
