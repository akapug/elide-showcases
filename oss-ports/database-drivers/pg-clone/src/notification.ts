export interface Notification {
  channel: string;
  payload: string;
  processId: number;
}

export type NotificationHandler = (notification: Notification) => void;
