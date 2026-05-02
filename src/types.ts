export interface Subscriber {
  refresh: () => void;
}

export interface Publisher {
  subscribe: (subscriber: Subscriber) => void;
  notifySubscribers: () => void;
}

export interface ConfigItem {
  key: string;
  default: string | number | boolean;
}

export interface TunnelPreset {
  port: number;
  hostname: string | null;
  lastUsedAt: number;
}
