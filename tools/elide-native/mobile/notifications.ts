/**
 * Elide Mobile Framework - Push Notifications
 *
 * Local and remote push notifications for mobile apps.
 */

import { EventEmitter } from '../desktop/events';
import { NativeBridge } from '../runtime/bridge';

export interface NotificationContent {
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  categoryId?: string;
  threadId?: string;
  summaryArgument?: string;
  summaryArgumentCount?: number;
  attachments?: NotificationAttachment[];
}

export interface NotificationAttachment {
  id: string;
  url: string;
  type?: string;
}

export interface NotificationTrigger {
  type: 'timeInterval' | 'calendar' | 'location';
  repeats?: boolean;
  // For timeInterval
  seconds?: number;
  // For calendar
  date?: Date;
  dateComponents?: {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
    weekday?: number;
  };
  // For location
  region?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
}

export interface LocalNotification {
  id: string;
  content: NotificationContent;
  trigger: NotificationTrigger;
}

export interface ReceivedNotification {
  id: string;
  title: string;
  body: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  date: Date;
  userInteraction: boolean;
  foreground: boolean;
}

export interface PushNotificationToken {
  token: string;
  os: 'ios' | 'android';
}

export class Notifications extends EventEmitter {
  private static instance: Notifications;

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  static getInstance(): Notifications {
    if (!Notifications.instance) {
      Notifications.instance = new Notifications();
    }
    return Notifications.instance;
  }

  private setupEventHandlers(): void {
    NativeBridge.onNotificationReceived((notification: ReceivedNotification) => {
      if (notification.foreground) {
        this.emit('received', notification);
      } else {
        this.emit('opened', notification);
      }
    });

    NativeBridge.onNotificationAction((action: string, notification: ReceivedNotification) => {
      this.emit('action', action, notification);
    });

    NativeBridge.onPushTokenReceived((token: PushNotificationToken) => {
      this.emit('token', token);
    });

    NativeBridge.onPushTokenError((error: Error) => {
      this.emit('token-error', error);
    });
  }

  // Permissions

  async requestPermissions(): Promise<{
    granted: boolean;
    alert: boolean;
    badge: boolean;
    sound: boolean;
  }> {
    return NativeBridge.requestNotificationPermissions();
  }

  async checkPermissions(): Promise<{
    granted: boolean;
    alert: boolean;
    badge: boolean;
    sound: boolean;
  }> {
    return NativeBridge.checkNotificationPermissions();
  }

  // Local Notifications

  async scheduleNotification(notification: LocalNotification): Promise<string> {
    return NativeBridge.scheduleLocalNotification(notification);
  }

  async cancelNotification(id: string): Promise<void> {
    return NativeBridge.cancelLocalNotification(id);
  }

  async cancelAllNotifications(): Promise<void> {
    return NativeBridge.cancelAllLocalNotifications();
  }

  async getPendingNotifications(): Promise<LocalNotification[]> {
    return NativeBridge.getPendingNotifications();
  }

  async getDeliveredNotifications(): Promise<ReceivedNotification[]> {
    return NativeBridge.getDeliveredNotifications();
  }

  async removeDeliveredNotification(id: string): Promise<void> {
    return NativeBridge.removeDeliveredNotification(id);
  }

  async removeAllDeliveredNotifications(): Promise<void> {
    return NativeBridge.removeAllDeliveredNotifications();
  }

  // Push Notifications

  async registerForPushNotifications(): Promise<void> {
    return NativeBridge.registerForPushNotifications();
  }

  async unregisterForPushNotifications(): Promise<void> {
    return NativeBridge.unregisterForPushNotifications();
  }

  async getPushToken(): Promise<string | null> {
    return NativeBridge.getPushToken();
  }

  // Badge

  async setBadgeCount(count: number): Promise<void> {
    return NativeBridge.setNotificationBadgeCount(count);
  }

  async getBadgeCount(): Promise<number> {
    return NativeBridge.getNotificationBadgeCount();
  }

  // Notification Categories (Actions)

  async setNotificationCategories(categories: NotificationCategory[]): Promise<void> {
    return NativeBridge.setNotificationCategories(categories);
  }
}

export interface NotificationCategory {
  id: string;
  actions: NotificationAction[];
  intentIdentifiers?: string[];
  options?: ('customDismissAction' | 'allowInCarPlay' | 'hiddenPreviewShowTitle' | 'hiddenPreviewShowSubtitle')[];
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: ('authenticationRequired' | 'destructive' | 'foreground')[];
  textInput?: {
    buttonTitle: string;
    placeholder: string;
  };
}

// Helper functions for common notification patterns

export class NotificationHelpers {
  static createImmediateNotification(title: string, body: string, data?: Record<string, any>): LocalNotification {
    return {
      id: `notif-${Date.now()}`,
      content: {
        title,
        body,
        data,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 1,
        repeats: false,
      },
    };
  }

  static createDelayedNotification(
    title: string,
    body: string,
    seconds: number,
    data?: Record<string, any>
  ): LocalNotification {
    return {
      id: `notif-${Date.now()}`,
      content: {
        title,
        body,
        data,
      },
      trigger: {
        type: 'timeInterval',
        seconds,
        repeats: false,
      },
    };
  }

  static createDailyNotification(
    title: string,
    body: string,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): LocalNotification {
    return {
      id: `notif-${Date.now()}`,
      content: {
        title,
        body,
        data,
      },
      trigger: {
        type: 'calendar',
        dateComponents: {
          hour,
          minute,
        },
        repeats: true,
      },
    };
  }

  static createWeeklyNotification(
    title: string,
    body: string,
    weekday: number,
    hour: number,
    minute: number,
    data?: Record<string, any>
  ): LocalNotification {
    return {
      id: `notif-${Date.now()}`,
      content: {
        title,
        body,
        data,
      },
      trigger: {
        type: 'calendar',
        dateComponents: {
          weekday,
          hour,
          minute,
        },
        repeats: true,
      },
    };
  }
}

// Export singleton instance
export const notifications = Notifications.getInstance();
