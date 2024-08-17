import { Subscriber } from './types';

export enum CloudflareTunnelStatus {
  starting = "Starting",
  running = "Running",
  stopping = "Stopping"
}

export class CloudflareTunnel {
  tunnelUri: string = "";
  private _status: CloudflareTunnelStatus = CloudflareTunnelStatus.starting;
  private subscribers: Subscriber[] = [];

  constructor(public hostname: string, public port: number) {}

  get url(): string {
    return `${this.hostname}:${this.port}`;
  }

  get label(): string {
    return `${this.url}\t${this.status}`;
  }

  get status(): CloudflareTunnelStatus {
    return this._status;
  }

  set status(value: CloudflareTunnelStatus) {
    this._status = value;
    this.notifySubscribers();
  }

  subscribe(subscriber: Subscriber) {
    this.subscribers.push(subscriber);
  }

  private notifySubscribers() {
    this.subscribers.forEach(observer => observer.refresh());
  }
}
