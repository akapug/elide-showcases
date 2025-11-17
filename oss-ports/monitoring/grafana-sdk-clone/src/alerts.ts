/**
 * Alert Implementations
 */

import type {
  AlertOptions,
  AlertCondition,
  AlertNotificationOptions,
  AlertNotificationRef,
} from './types';

/**
 * Alert class
 */
export class Alert {
  public name: string;
  public message: string;
  public conditions: AlertCondition[];
  public executionErrorState: string;
  public frequency: string;
  public handler: number;
  public noDataState: string;
  public notifications: AlertNotificationRef[];
  public for: string;

  constructor(options: AlertOptions) {
    this.name = options.name;
    this.message = options.message || '';
    this.conditions = options.conditions;
    this.executionErrorState = options.executionErrorState || 'alerting';
    this.frequency = options.frequency || '60s';
    this.handler = options.handler || 1;
    this.noDataState = options.noDataState || 'no_data';
    this.notifications = options.notifications || [];
    this.for = options.for || '5m';
  }

  /**
   * Add a notification to the alert
   */
  addNotification(notification: AlertNotification): void {
    this.notifications.push({ uid: notification.uid });
  }

  /**
   * Remove a notification from the alert
   */
  removeNotification(uid: string): void {
    const index = this.notifications.findIndex((n) => n.uid === uid);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Convert alert to JSON
   */
  toJSON(): any {
    return {
      name: this.name,
      message: this.message,
      conditions: this.conditions,
      executionErrorState: this.executionErrorState,
      frequency: this.frequency,
      handler: this.handler,
      noDataState: this.noDataState,
      notifications: this.notifications,
      for: this.for,
    };
  }
}

/**
 * Alert Notification class
 */
export class AlertNotification {
  public type: string;
  public uid: string;
  public name: string;
  public isDefault: boolean;
  public sendReminder: boolean;
  public frequency: string;
  public settings: Record<string, any>;

  constructor(options: AlertNotificationOptions) {
    this.type = options.type;
    this.uid = options.uid;
    this.name = options.name || options.uid;
    this.isDefault = options.isDefault || false;
    this.sendReminder = options.sendReminder || false;
    this.frequency = options.frequency || '';
    this.settings = options.settings || {};
  }

  /**
   * Convert notification to JSON
   */
  toJSON(): any {
    return {
      type: this.type,
      uid: this.uid,
      name: this.name,
      isDefault: this.isDefault,
      sendReminder: this.sendReminder,
      frequency: this.frequency,
      settings: this.settings,
    };
  }
}

/**
 * Create a threshold alert condition
 */
export function createThresholdCondition(options: {
  refId: string;
  evaluator: 'gt' | 'lt' | 'within_range' | 'outside_range';
  threshold: number | number[];
  timeRange?: string;
  reducer?: string;
}): AlertCondition {
  const threshold = Array.isArray(options.threshold)
    ? options.threshold
    : [options.threshold];

  return {
    evaluator: {
      type: options.evaluator,
      params: threshold,
    },
    operator: {
      type: 'and',
    },
    query: {
      params: [options.refId, options.timeRange || '5m', 'now'],
    },
    reducer: {
      type: options.reducer || 'avg',
    },
    type: 'query',
  };
}

/**
 * Create a no data alert condition
 */
export function createNoDataCondition(): AlertCondition {
  return {
    evaluator: {
      type: 'no_value',
      params: [],
    },
    operator: {
      type: 'and',
    },
    query: {
      params: [],
    },
    reducer: {
      type: 'avg',
    },
    type: 'query',
  };
}
