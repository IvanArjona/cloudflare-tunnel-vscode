import CloudflareTunnelTreeItem from "./treeItems";
import BaseProvider from "./base";
import { CloudflareTunnel, CloudflareTunnelStatus } from "../tunnel";
import { Subscriber } from "../types";

export class CloudflareTunnelProvider
  extends BaseProvider<CloudflareTunnel>
  implements Subscriber
{
  #tunnels: CloudflareTunnel[] = [];

  getTreeItem(tunnel: CloudflareTunnel): CloudflareTunnelTreeItem {
    return new CloudflareTunnelTreeItem(tunnel);
  }

  getChildren(tunnel?: CloudflareTunnel): CloudflareTunnel[] {
    if (tunnel) {
      return [];
    }
    return this.#tunnels;
  }

  addTunnel(tunnel: CloudflareTunnel): void {
    this.#tunnels.push(tunnel);
    this.refresh();
  }

  removeTunnel(tunnel: CloudflareTunnel): void {
    const index = this.#tunnels.indexOf(tunnel);
    if (index === -1) {
      return;
    }
    this.#tunnels.splice(index, 1);
    this.refresh();
  }

  get tunnels(): CloudflareTunnel[] {
    return this.#tunnels;
  }

  runningTunnels(): CloudflareTunnel[] {
    return this.#tunnels.filter(
      (tunnel) => tunnel.status === CloudflareTunnelStatus.running
    );
  }

  hasPort(port: number): boolean {
    return this.#tunnels.some((tunnel) => tunnel.port === port);
  }

  hasHostname(hostname: string): boolean {
    return this.#tunnels.some((tunnel) => tunnel.hostname === hostname);
  }
}

export const cloudflareTunnelProvider = new CloudflareTunnelProvider();
