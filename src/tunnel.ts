import { ChildProcess } from "child_process";
import { Publisher, Subscriber } from "./types";

export enum CloudflareTunnelStatus {
  starting = "Starting",
  running = "Running",
  stopping = "Stopping",
}

export class CloudflareTunnel implements Publisher {
  tunnelUri: string = "";
  process?: ChildProcess;
  private _status: CloudflareTunnelStatus = CloudflareTunnelStatus.starting;
  private subscribers: Subscriber[] = [];

  constructor(
    public localHostname: string,
    public port: number,
    public hostname: string | null
  ) {}

  get url(): string {
    return `${this.localHostname}:${this.port}`;
  }

  get label(): string {
    return this.status === CloudflareTunnelStatus.running
      ? this.shortTunnelUri
      : this.url;
  }

  get description(): string {
    const quickTunnel = this.isQuickTunnel ? "Quick Tunnel" : null;
    return [this.url, this.status, quickTunnel, this.tunnelName]
      .filter(Boolean)
      .join("\t");
  }

  get status(): CloudflareTunnelStatus {
    return this._status;
  }

  get tunnelName(): string {
    if (this.isQuickTunnel) {
      return "";
    }
    return `cloudflare-tunnel-vscode-${this.port}`;
  }

  get isQuickTunnel(): boolean {
    return this.hostname === null;
  }

  get shortTunnelUri(): string {
    return this.tunnelUri.slice(8);
  }

  set status(value: CloudflareTunnelStatus) {
    this._status = value;
    this.notifySubscribers();
  }

  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
    this.notifySubscribers();
  }

  notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber.refresh();
    }
  }
}
