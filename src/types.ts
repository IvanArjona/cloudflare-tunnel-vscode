
export interface Publisher {
  subscribe: (subscriber: Subscriber) => void;
  notifySubscribers: () => void;
}

export interface Subscriber {
  refresh: () => void;
}
