import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";
import { CloudflareTunnelTreeItem } from "./treeItems";
import { BaseProvider } from "./base";
import { Subscriber } from "../types";

export class CloudflareTunnelProvider
  extends BaseProvider<CloudflareTunnel>
  implements Subscriber
{
  private _tunnels: CloudflareTunnel[] = [];

  getTreeItem(tunnel: CloudflareTunnel): CloudflareTunnelTreeItem {
    return new CloudflareTunnelTreeItem(tunnel);
  }

  getChildren(tunnel?: CloudflareTunnel): CloudflareTunnel[] {
    if (tunnel) {
      return [];
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

  runningTunnels(): CloudflareTunnel[] {
    return this._tunnels.filter(
      (tunnel) => tunnel.status === CloudflareTunnelStatus.running
    );
  }
}

export const cloudflareTunnelProvider = new CloudflareTunnelProvider();
