import { ChildProcess } from "child_process";
import { Subscriber } from "./types";

export enum CloudflareTunnelStatus {
  starting = "Starting",
  running = "Running",
  stopping = "Stopping",
}

export class CloudflareTunnel {
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
    return `${this.url}\t${this.status}`;
  }

  get status(): CloudflareTunnelStatus {
    return this._status;
  }

  get tunnelName(): string {
    return `cloudflare-tunnel-vscode-${this.port}`;
  }

  get isQuickTunnel(): boolean {
    return this.hostname === null;
  }

  set status(value: CloudflareTunnelStatus) {
    this._status = value;
    this.notifySubscribers();
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
    this.notifySubscribers();
  }

  private notifySubscribers() {
    for (const subscriber of this.subscribers) {
      subscriber.refresh();
    }
  }
}
