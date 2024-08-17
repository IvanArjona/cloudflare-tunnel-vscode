import { CloudflareTunnel } from "../tunnel";
import { TreeItem, CloudflareTunnelTreeItem } from "./treeItems";
import { BaseProvider } from "./base";
import { Subscriber } from "../types";

export class CloudflareTunnelProvider
  extends BaseProvider<CloudflareTunnel>
  implements Subscriber
{
  private _tunnels: CloudflareTunnel[] = [];

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
    return this._tunnels;
  }

  addTunnel(tunnel: CloudflareTunnel): void {
    this._tunnels.push(tunnel);
    this.refresh();
  }

  removeTunnel(tunnel: CloudflareTunnel): void {
    const index = this._tunnels.indexOf(tunnel);
    this._tunnels.splice(index, 1);
    this.refresh();
  }

  get tunnels(): CloudflareTunnel[] {
    return this._tunnels;
  }
}

export const cloudflareTunnelProvider = new CloudflareTunnelProvider();
