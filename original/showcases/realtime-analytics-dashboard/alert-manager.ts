/**
 * Alert Manager
 *
 * Real-time alert system for analytics metrics.
 * Supports threshold-based alerts, anomaly detection, and custom triggers.
 */

import type { DataAggregator } from './data-aggregator.ts';
import type { WebSocketManager } from './websocket-manager.ts';

export interface Alert {
  id: string;
  name: string;
  enabled: boolean;
  condition: AlertCondition;
  notification: NotificationConfig;
  cooldown?: number; // milliseconds between alerts
  lastTriggered?: number;
  triggerCount: number;
}

export interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'trend' | 'absence';
  metric: string;
  operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold?: number;
  timeWindow?: number; // milliseconds
  eventType?: string;
  property?: string;
}

export interface NotificationConfig {
  channels: ('websocket' | 'log' | 'webhook')[];
  severity: 'info' | 'warning' | 'critical';
  message?: string;
  webhookUrl?: string;
}

export interface AlertEvent {
  alertId: string;
  alertName: string;
  timestamp: number;
  severity: string;
  message: string;
  value: number;
  threshold?: number;
  metadata: Record<string, any>;
}

export class AlertManager {
  private alerts = new Map<string, Alert>();
  private aggregator: DataAggregator;
  private wsManager?: WebSocketManager;
  private alertHistory: AlertEvent[] = [];
  private maxHistorySize = 1000;

  private stats = {
    alertsEvaluated: 0,
    alertsTriggered: 0,
    notificationsSent: 0
  };

  constructor(aggregator: DataAggregator, wsManager?: WebSocketManager) {
    this.aggregator = aggregator;
    this.wsManager = wsManager;
    this.startEvaluationLoop();
  }

  // Create alert
  create(alert: Omit<Alert, 'id' | 'triggerCount'>): string {
    const id = this.generateAlertId();

    const newAlert: Alert = {
      id,
      triggerCount: 0,
      ...alert
    };

    this.alerts.set(id, newAlert);
    console.log(`Alert created: ${newAlert.name} (${id})`);

    return id;
  }

  // Update alert
  update(id: string, updates: Partial<Alert>): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    Object.assign(alert, updates);
    return true;
  }

  // Delete alert
  delete(id: string): boolean {
    return this.alerts.delete(id);
  }

  // Get alert
  get(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  // List all alerts
  list(): Alert[] {
    return Array.from(this.alerts.values());
  }

  // Enable/disable alert
  setEnabled(id: string, enabled: boolean): boolean {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    alert.enabled = enabled;
    return true;
  }

  // Evaluate all alerts
  private async evaluateAlerts(): Promise<void> {
    const now = Date.now();

    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      // Check cooldown
      if (alert.cooldown && alert.lastTriggered) {
        if (now - alert.lastTriggered < alert.cooldown) {
          continue;
        }
      }

      this.stats.alertsEvaluated++;

      const triggered = await this.evaluateCondition(alert.condition);

      if (triggered.triggered) {
        await this.triggerAlert(alert, triggered.value, triggered.metadata);
      }
    }
  }

  // Evaluate alert condition
  private async evaluateCondition(condition: AlertCondition): Promise<{
    triggered: boolean;
    value: number;
    metadata: Record<string, any>;
  }> {
    const now = Date.now();
    const timeWindow = condition.timeWindow || 300000; // Default 5 minutes
    const startTime = now - timeWindow;

    let value = 0;
    const metadata: Record<string, any> = {};

    try {
      switch (condition.type) {
        case 'threshold': {
          if (!condition.eventType || !condition.property) {
            return { triggered: false, value: 0, metadata };
          }

          // Get metric value
          const events = this.aggregator.query({
            type: condition.eventType,
            startTime,
            endTime: now
          });

          const values = events
            .map(e => e.properties[condition.property!])
            .filter(v => typeof v === 'number');

          if (values.length === 0) {
            return { triggered: false, value: 0, metadata };
          }

          // Calculate aggregated value (average)
          value = values.reduce((a, b) => a + b, 0) / values.length;

          metadata.eventCount = values.length;
          metadata.min = Math.min(...values);
          metadata.max = Math.max(...values);

          // Check threshold
          if (condition.threshold !== undefined && condition.operator) {
            const triggered = this.compareValues(value, condition.operator, condition.threshold);
            return { triggered, value, metadata };
          }

          break;
        }

        case 'anomaly': {
          // Simple anomaly detection: check if current value deviates significantly from average
          if (!condition.eventType || !condition.property) {
            return { triggered: false, value: 0, metadata };
          }

          const events = this.aggregator.query({
            type: condition.eventType,
            startTime: startTime - timeWindow, // Look back twice as far
            endTime: now
          });

          const values = events
            .map(e => e.properties[condition.property!])
            .filter(v => typeof v === 'number');

          if (values.length < 10) {
            return { triggered: false, value: 0, metadata }; // Not enough data
          }

          // Calculate mean and standard deviation
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);

          // Get current value (last few events)
          const recentValues = values.slice(-5);
          value = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

          metadata.mean = mean;
          metadata.stdDev = stdDev;
          metadata.deviation = Math.abs(value - mean) / stdDev;

          // Trigger if value deviates more than 2 standard deviations
          const triggered = Math.abs(value - mean) > 2 * stdDev;
          return { triggered, value, metadata };
        }

        case 'trend': {
          // Detect increasing or decreasing trend
          if (!condition.eventType || !condition.property) {
            return { triggered: false, value: 0, metadata };
          }

          const aggregated = this.aggregator.aggregate(
            condition.eventType,
            condition.property,
            startTime,
            now,
            timeWindow / 5 // 5 buckets
          );

          if (aggregated.length < 3) {
            return { triggered: false, value: 0, metadata };
          }

          // Calculate trend (simple linear regression)
          let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

          for (let i = 0; i < aggregated.length; i++) {
            sumX += i;
            sumY += aggregated[i].value;
            sumXY += i * aggregated[i].value;
            sumX2 += i * i;
          }

          const n = aggregated.length;
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

          value = slope;
          metadata.slope = slope;
          metadata.direction = slope > 0 ? 'increasing' : 'decreasing';

          // Trigger if trend slope exceeds threshold
          if (condition.threshold !== undefined) {
            const triggered = Math.abs(slope) > condition.threshold;
            return { triggered, value, metadata };
          }

          break;
        }

        case 'absence': {
          // Alert when no events received in time window
          if (!condition.eventType) {
            return { triggered: false, value: 0, metadata };
          }

          const events = this.aggregator.query({
            type: condition.eventType,
            startTime,
            endTime: now
          });

          value = events.length;
          metadata.eventCount = events.length;

          const triggered = events.length === 0;
          return { triggered, value, metadata };
        }
      }
    } catch (error) {
      console.error(`Error evaluating alert condition:`, error);
    }

    return { triggered: false, value: 0, metadata };
  }

  // Compare values based on operator
  private compareValues(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  // Trigger alert
  private async triggerAlert(
    alert: Alert,
    value: number,
    metadata: Record<string, any>
  ): Promise<void> {
    const now = Date.now();

    // Update alert state
    alert.lastTriggered = now;
    alert.triggerCount++;

    this.stats.alertsTriggered++;

    // Create alert event
    const alertEvent: AlertEvent = {
      alertId: alert.id,
      alertName: alert.name,
      timestamp: now,
      severity: alert.notification.severity,
      message: alert.notification.message || `Alert triggered: ${alert.name}`,
      value,
      threshold: alert.condition.threshold,
      metadata
    };

    // Store in history
    this.alertHistory.push(alertEvent);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    console.log(`🚨 Alert triggered: ${alert.name} (value: ${value})`);

    // Send notifications
    await this.sendNotifications(alert.notification, alertEvent);
  }

  // Send notifications
  private async sendNotifications(
    config: NotificationConfig,
    event: AlertEvent
  ): Promise<void> {
    for (const channel of config.channels) {
      try {
        switch (channel) {
          case 'websocket':
            if (this.wsManager) {
              this.wsManager.broadcast('alerts', {
                type: 'alert',
                event
              });
              this.stats.notificationsSent++;
            }
            break;

          case 'log':
            console.log(`[${config.severity.toUpperCase()}] ${event.message}`, event);
            this.stats.notificationsSent++;
            break;

          case 'webhook':
            if (config.webhookUrl) {
              await this.sendWebhook(config.webhookUrl, event);
              this.stats.notificationsSent++;
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }
  }

  // Send webhook notification
  private async sendWebhook(url: string, event: AlertEvent): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  // Start evaluation loop
  private startEvaluationLoop(): void {
    setInterval(() => {
      this.evaluateAlerts();
    }, 5000); // Evaluate every 5 seconds
  }

  // Get alert history
  getHistory(limit?: number): AlertEvent[] {
    const history = [...this.alertHistory];
    return limit ? history.slice(-limit) : history;
  }

  // Get alert statistics
  getStats() {
    return {
      ...this.stats,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.enabled).length,
      totalAlerts: this.alerts.size,
      historySize: this.alertHistory.length
    };
  }

  // Generate alert ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear history
  clearHistory(): void {
    this.alertHistory = [];
  }
}
