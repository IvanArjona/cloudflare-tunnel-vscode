import { ExtensionContext } from "vscode";

export interface Publisher {
  subscribe: (subscriber: Subscriber) => void;
  notifySubscribers: () => void;
}

export interface Subscriber {
  refresh: () => void;
}

export type Command = (
  context: ExtensionContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => Promise<void>;
