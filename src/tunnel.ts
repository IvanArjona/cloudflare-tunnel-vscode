import { cloudflareTunnelProvider } from "./providers/tunnels";

export enum CloudflareTunnelStatus {
  starting = "Starting",
  running = "Running",
  stopping = "Stopping"
}

export class CloudflareTunnel {
  tunnelUri?: string;
  private _status: CloudflareTunnelStatus = CloudflareTunnelStatus.starting;

  constructor(
    public hostname: string,
    public port: number
  ) { }

  get url(): string {
    return `${this.hostname}:${this.port}`;
  }

  get label(): string {
    return `${this.url}\t${this.status}\t${this.tunnelUri || ""}`;
  }

  get status(): CloudflareTunnelStatus {
    return this._status;
  }

  set status(value: CloudflareTunnelStatus) {
    this._status = value;
    cloudflareTunnelProvider.refresh();
  }
}
