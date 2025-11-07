/**
 * Alert Manager
 *
 * Manages alerts, notifications, and incident response.
 * Supports multiple notification channels and alert aggregation.
 */

import * as fs from 'fs';
import * as path from 'path';
import ms from 'ms';
import { Metric, MetricValue } from './agent';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  tags?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: string;
  condition: AlertCondition;
  severity: Alert['severity'];
  cooldown: string; // e.g., "5m"
  notificationChannels: string[];
  tags?: Record<string, string>;
}

export interface AlertCondition {
  type: 'threshold' | 'rate' | 'anomaly' | 'absence';
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value?: number;
  duration?: string; // e.g., "5m"
  sensitivity?: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'console' | 'email' | 'slack' | 'webhook' | 'pagerduty';
  enabled: boolean;
  config: Record<string, any>;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Alert['severity'];
  status: 'open' | 'investigating' | 'resolved';
  alerts: Alert[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
}

// ============================================================================
// Alert Manager
// ============================================================================

export class AlertManager {
  private alerts: Map<string, Alert>;
  private rules: Map<string, AlertRule>;
  private channels: Map<string, NotificationChannel>;
  private incidents: Map<string, Incident>;
  private alertHistory: Alert[];
  private lastAlertTime: Map<string, Date>;

  constructor() {
    this.alerts = new Map();
    this.rules = new Map();
    this.channels = new Map();
    this.incidents = new Map();
    this.alertHistory = [];
    this.lastAlertTime = new Map();

    // Register default channel
    this.registerChannel({
      id: 'console',
      name: 'Console',
      type: 'console',
      enabled: true,
      config: {},
    });
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.set(newAlert.id, newAlert);

    console.log(`[AlertManager] Alert created: [${newAlert.severity.toUpperCase()}] ${newAlert.title}`);

    // Send notifications
    this.notifyAlert(newAlert);

    return newAlert;
  }

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    console.log(`[AlertManager] Rule registered: ${rule.name}`);
  }

  /**
   * Evaluate rules against metrics
   */
  async evaluateRules(metrics: Metric[]): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      // Check cooldown
      if (this.isInCooldown(rule)) {
        continue;
      }

      // Find metric
      const metric = metrics.find(m => m.name === rule.metric);
      if (!metric) {
        continue;
      }

      // Evaluate condition
      const triggered = await this.evaluateCondition(rule, metric);

      if (triggered) {
        const alert = this.createAlert({
          severity: rule.severity,
          title: rule.name,
          message: `Alert rule triggered: ${rule.description}`,
          source: 'rule-engine',
          metric: rule.metric,
          tags: rule.tags,
        });

        triggeredAlerts.push(alert);
        this.lastAlertTime.set(rule.id, new Date());
      }
    }

    return triggeredAlerts;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(rule: AlertRule, metric: Metric): Promise<boolean> {
    const condition = rule.condition;

    switch (condition.type) {
      case 'threshold':
        return this.evaluateThreshold(metric, condition);
      case 'rate':
        return this.evaluateRate(metric, condition);
      case 'anomaly':
        return this.evaluateAnomaly(metric, condition);
      case 'absence':
        return this.evaluateAbsence(metric, condition);
      default:
        return false;
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(metric: Metric, condition: AlertCondition): boolean {
    if (!metric.values || metric.values.length === 0) {
      return false;
    }

    const latest = metric.values[metric.values.length - 1];
    const value = latest.value;
    const threshold = condition.value || 0;

    switch (condition.operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluate rate of change condition
   */
  private evaluateRate(metric: Metric, condition: AlertCondition): boolean {
    if (!metric.values || metric.values.length < 2) {
      return false;
    }

    // Calculate rate of change
    const latest = metric.values[metric.values.length - 1];
    const previous = metric.values[metric.values.length - 2];

    const timeDelta = (latest.timestamp.getTime() - previous.timestamp.getTime()) / 1000; // seconds
    const valueDelta = latest.value - previous.value;
    const rate = valueDelta / timeDelta;

    const threshold = condition.value || 0;

    switch (condition.operator) {
      case '>':
        return rate > threshold;
      case '<':
        return rate < threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluate anomaly condition
   */
  private evaluateAnomaly(metric: Metric, condition: AlertCondition): boolean {
    if (!metric.values || metric.values.length < 10) {
      return false;
    }

    // Simple anomaly detection using z-score
    const values = metric.values.slice(-50).map(v => v.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return false;
    }

    const latest = metric.values[metric.values.length - 1];
    const zScore = Math.abs((latest.value - mean) / stdDev);

    const sensitivity = condition.sensitivity || 3;
    return zScore > sensitivity;
  }

  /**
   * Evaluate absence condition
   */
  private evaluateAbsence(metric: Metric, condition: AlertCondition): boolean {
    if (!metric.values || metric.values.length === 0) {
      return true; // No data
    }

    const latest = metric.values[metric.values.length - 1];
    const age = Date.now() - latest.timestamp.getTime();

    const maxAge = condition.duration ? ms(condition.duration) : ms('5m');
    return age > maxAge;
  }

  /**
   * Check if rule is in cooldown
   */
  private isInCooldown(rule: AlertRule): boolean {
    const lastAlert = this.lastAlertTime.get(rule.id);
    if (!lastAlert) {
      return false;
    }

    const cooldownMs = ms(rule.cooldown);
    const elapsed = Date.now() - lastAlert.getTime();

    return elapsed < cooldownMs;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    console.log(`[AlertManager] Alert ${alertId} acknowledged by ${acknowledgedBy}`);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    // Move to history
    this.alerts.delete(alertId);
    this.alertHistory.push(alert);

    console.log(`[AlertManager] Alert ${alertId} resolved`);
  }

  /**
   * Register a notification channel
   */
  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    console.log(`[AlertManager] Channel registered: ${channel.name}`);
  }

  /**
   * Send notifications for an alert
   */
  private notifyAlert(alert: Alert): void {
    for (const channel of this.channels.values()) {
      if (!channel.enabled) {
        continue;
      }

      try {
        this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`[AlertManager] Failed to send notification via ${channel.name}:`, error);
      }
    }
  }

  /**
   * Send notification to a channel
   */
  private sendNotification(channel: NotificationChannel, alert: Alert): void {
    switch (channel.type) {
      case 'console':
        this.notifyConsole(alert);
        break;
      case 'email':
        this.notifyEmail(channel, alert);
        break;
      case 'slack':
        this.notifySlack(channel, alert);
        break;
      case 'webhook':
        this.notifyWebhook(channel, alert);
        break;
      default:
        console.warn(`[AlertManager] Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Console notification
   */
  private notifyConsole(alert: Alert): void {
    const icon = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[alert.severity];

    console.log(`\n${icon} [${alert.severity.toUpperCase()}] ${alert.title}`);
    console.log(`   ${alert.message}`);
    if (alert.metric) {
      console.log(`   Metric: ${alert.metric}`);
    }
    if (alert.value !== undefined) {
      console.log(`   Value: ${alert.value}`);
    }
    console.log(`   Time: ${alert.timestamp.toISOString()}\n`);
  }

  /**
   * Email notification (stub)
   */
  private notifyEmail(channel: NotificationChannel, alert: Alert): void {
    console.log(`[AlertManager] Would send email to ${channel.config.to}: ${alert.title}`);
  }

  /**
   * Slack notification (stub)
   */
  private notifySlack(channel: NotificationChannel, alert: Alert): void {
    console.log(`[AlertManager] Would send Slack message to ${channel.config.channel}: ${alert.title}`);
  }

  /**
   * Webhook notification (stub)
   */
  private notifyWebhook(channel: NotificationChannel, alert: Alert): void {
    console.log(`[AlertManager] Would send webhook to ${channel.config.url}: ${alert.title}`);
  }

  /**
   * Create an incident from alerts
   */
  createIncident(title: string, description: string, alertIds: string[]): Incident {
    const alerts = alertIds
      .map(id => this.alerts.get(id))
      .filter((a): a is Alert => a !== undefined);

    if (alerts.length === 0) {
      throw new Error('No valid alerts found for incident');
    }

    const maxSeverity = this.getMaxSeverity(alerts.map(a => a.severity));

    const incident: Incident = {
      id: this.generateIncidentId(),
      title,
      description,
      severity: maxSeverity,
      status: 'open',
      alerts,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.incidents.set(incident.id, incident);

    console.log(`[AlertManager] Incident created: ${incident.id} - ${title}`);

    return incident;
  }

  /**
   * Update incident status
   */
  updateIncidentStatus(incidentId: string, status: Incident['status']): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.status = status;
    incident.updatedAt = new Date();

    if (status === 'resolved') {
      incident.resolvedAt = new Date();

      // Resolve all associated alerts
      for (const alert of incident.alerts) {
        if (!alert.resolved) {
          this.resolveAlert(alert.id);
        }
      }
    }

    console.log(`[AlertManager] Incident ${incidentId} status updated to ${status}`);
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const allAlerts = [
      ...Array.from(this.alerts.values()),
      ...this.alertHistory,
    ];

    const activeAlerts = Array.from(this.alerts.values());

    const stats: AlertStats = {
      totalAlerts: allAlerts.length,
      activeAlerts: activeAlerts.length,
      acknowledgedAlerts: allAlerts.filter(a => a.acknowledged).length,
      resolvedAlerts: allAlerts.filter(a => a.resolved).length,
      bySeverity: {},
      bySource: {},
    };

    // Count by severity
    for (const alert of allAlerts) {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
      stats.bySource[alert.source] = (stats.bySource[alert.source] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert history
   */
  getHistory(limit?: number): Alert[] {
    const history = [...this.alertHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get maximum severity from a list
   */
  private getMaxSeverity(severities: Alert['severity'][]): Alert['severity'] {
    const priority = { critical: 4, error: 3, warning: 2, info: 1 };
    let max: Alert['severity'] = 'info';
    let maxPriority = 0;

    for (const severity of severities) {
      const p = priority[severity];
      if (p > maxPriority) {
        maxPriority = p;
        max = severity;
      }
    }

    return max;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export alert report
   */
  exportReport(format: 'json' | 'text' = 'text'): string {
    const stats = this.getStats();
    const activeAlerts = this.getActiveAlerts();

    if (format === 'json') {
      return JSON.stringify({
        stats,
        activeAlerts,
        incidents: Array.from(this.incidents.values()),
      }, null, 2);
    }

    // Text format
    let report = '=== Alert Report ===\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Statistics\n';
    report += `Total Alerts: ${stats.totalAlerts}\n`;
    report += `Active: ${stats.activeAlerts}\n`;
    report += `Acknowledged: ${stats.acknowledgedAlerts}\n`;
    report += `Resolved: ${stats.resolvedAlerts}\n\n`;

    report += '## By Severity\n';
    for (const [severity, count] of Object.entries(stats.bySeverity)) {
      report += `${severity}: ${count}\n`;
    }
    report += '\n';

    report += '## Active Alerts\n';
    for (const alert of activeAlerts) {
      report += `[${alert.severity.toUpperCase()}] ${alert.title}\n`;
      report += `  ${alert.message}\n`;
      report += `  Time: ${alert.timestamp.toISOString()}\n`;
      report += `  Acknowledged: ${alert.acknowledged}\n\n`;
    }

    return report;
  }
}

// ============================================================================
// Pre-built Alert Rules
// ============================================================================

export function createDefaultRules(): AlertRule[] {
  return [
    {
      id: 'high-cpu',
      name: 'High CPU Usage',
      description: 'CPU usage above 80%',
      enabled: true,
      metric: 'system.cpu.usage',
      condition: {
        type: 'threshold',
        operator: '>',
        value: 80,
      },
      severity: 'warning',
      cooldown: '5m',
      notificationChannels: ['console'],
    },
    {
      id: 'critical-cpu',
      name: 'Critical CPU Usage',
      description: 'CPU usage above 95%',
      enabled: true,
      metric: 'system.cpu.usage',
      condition: {
        type: 'threshold',
        operator: '>',
        value: 95,
      },
      severity: 'critical',
      cooldown: '2m',
      notificationChannels: ['console'],
    },
    {
      id: 'high-memory',
      name: 'High Memory Usage',
      description: 'Memory usage above 85%',
      enabled: true,
      metric: 'system.memory.usage',
      condition: {
        type: 'threshold',
        operator: '>',
        value: 85,
      },
      severity: 'warning',
      cooldown: '5m',
      notificationChannels: ['console'],
    },
    {
      id: 'disk-full',
      name: 'Disk Almost Full',
      description: 'Disk usage above 90%',
      enabled: true,
      metric: 'system.disk.usage',
      condition: {
        type: 'threshold',
        operator: '>',
        value: 90,
      },
      severity: 'error',
      cooldown: '10m',
      notificationChannels: ['console'],
    },
  ];
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  console.log('=== Alert Manager ===\n');

  const manager = new AlertManager();

  // Register default rules
  const rules = createDefaultRules();
  for (const rule of rules) {
    manager.registerRule(rule);
  }

  // Create some example alerts
  manager.createAlert({
    severity: 'warning',
    title: 'High CPU Usage Detected',
    message: 'CPU usage is at 85%',
    source: 'monitoring-agent',
    metric: 'system.cpu.usage',
    value: 85,
    threshold: 80,
  });

  manager.createAlert({
    severity: 'error',
    title: 'Database Connection Failed',
    message: 'Unable to connect to primary database',
    source: 'app',
  });

  // Print stats
  console.log('\n--- Alert Statistics ---');
  const stats = manager.getStats();
  console.log(`Total: ${stats.totalAlerts}`);
  console.log(`Active: ${stats.activeAlerts}`);
  console.log('By Severity:', stats.bySeverity);

  // Export report
  console.log('\n--- Alert Report ---');
  console.log(manager.exportReport('text'));
}

if (require.main === module) {
  main().catch(console.error);
}
