/**
 * Alert management and dispatch system.
 * Handles alert generation, deduplication, and notification.
 */

import { ScoringResult } from './scorer.js';
import { EventEmitter } from 'events';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  status: AlertStatus;
  eventId: string;
  score: number;
  confidence: number;
  algorithm: string;
  message: string;
  metadata?: Record<string, any>;
  acknowledgedAt?: number;
  resolvedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  scoreThreshold: number;
  confidenceThreshold: number;
  severity: AlertSeverity;
  cooldownMs: number;
  maxAlertsPerWindow?: number;
  windowMs?: number;
}

export interface AlertChannelConfig {
  type: 'webhook' | 'websocket' | 'log' | 'email';
  enabled: boolean;
  config: Record<string, any>;
}

export class AlertManager extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: AlertChannelConfig[] = [];
  private cooldowns: Map<string, number> = new Map();
  private windowCounts: Map<string, number[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert rules.
   */
  private initializeDefaultRules(): void {
    this.addRule({
      id: 'critical_anomaly',
      name: 'Critical Anomaly Detected',
      enabled: true,
      scoreThreshold: 0.9,
      confidenceThreshold: 0.8,
      severity: 'critical',
      cooldownMs: 60000, // 1 minute
      maxAlertsPerWindow: 5,
      windowMs: 300000 // 5 minutes
    });

    this.addRule({
      id: 'high_anomaly',
      name: 'High Severity Anomaly',
      enabled: true,
      scoreThreshold: 0.7,
      confidenceThreshold: 0.7,
      severity: 'high',
      cooldownMs: 120000, // 2 minutes
      maxAlertsPerWindow: 10,
      windowMs: 300000
    });

    this.addRule({
      id: 'medium_anomaly',
      name: 'Medium Severity Anomaly',
      enabled: true,
      scoreThreshold: 0.5,
      confidenceThreshold: 0.6,
      severity: 'medium',
      cooldownMs: 300000, // 5 minutes
      maxAlertsPerWindow: 20,
      windowMs: 600000 // 10 minutes
    });
  }

  /**
   * Process a scoring result and generate alerts if needed.
   */
  async processResult(result: ScoringResult): Promise<Alert | null> {
    if (!result.isAnomaly) {
      return null;
    }

    // Find matching rules
    const matchingRules = this.findMatchingRules(result);

    if (matchingRules.length === 0) {
      return null;
    }

    // Use the highest severity rule
    const rule = matchingRules.reduce((highest, current) =>
      this.getSeverityLevel(current.severity) > this.getSeverityLevel(highest.severity)
        ? current
        : highest
    );

    // Check cooldown
    if (this.isInCooldown(rule.id)) {
      return null;
    }

    // Check rate limiting
    if (!this.checkRateLimit(rule)) {
      return null;
    }

    // Create alert
    const alert = this.createAlert(result, rule);

    // Store alert
    this.alerts.set(alert.id, alert);

    // Set cooldown
    this.cooldowns.set(rule.id, Date.now() + rule.cooldownMs);

    // Update rate limit window
    this.updateRateLimitWindow(rule);

    // Dispatch alert
    await this.dispatchAlert(alert);

    // Emit event
    this.emit('alert', alert);

    return alert;
  }

  /**
   * Add an alert rule.
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove an alert rule.
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Update an alert rule.
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  /**
   * Add an alert channel.
   */
  addChannel(channel: AlertChannelConfig): void {
    this.channels.push(channel);
  }

  /**
   * Get all active alerts.
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.status === 'active')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get alert by ID.
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    this.emit('alert:acknowledged', alert);

    return true;
  }

  /**
   * Resolve an alert.
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    this.emit('alert:resolved', alert);

    return true;
  }

  /**
   * Get alert statistics.
   */
  getStats(): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const alerts = Array.from(this.alerts.values());

    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      bySeverity: {
        low: alerts.filter(a => a.severity === 'low').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        high: alerts.filter(a => a.severity === 'high').length,
        critical: alerts.filter(a => a.severity === 'critical').length
      }
    };
  }

  /**
   * Clear old resolved alerts.
   */
  clearOldAlerts(maxAgeMs: number = 86400000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleared = 0;

    for (const [id, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Find matching rules for a scoring result.
   */
  private findMatchingRules(result: ScoringResult): AlertRule[] {
    const matching: AlertRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (
        Math.abs(result.score) >= rule.scoreThreshold &&
        result.confidence >= rule.confidenceThreshold
      ) {
        matching.push(rule);
      }
    }

    return matching;
  }

  /**
   * Check if a rule is in cooldown.
   */
  private isInCooldown(ruleId: string): boolean {
    const cooldownUntil = this.cooldowns.get(ruleId);
    if (!cooldownUntil) return false;

    if (Date.now() >= cooldownUntil) {
      this.cooldowns.delete(ruleId);
      return false;
    }

    return true;
  }

  /**
   * Check rate limit for a rule.
   */
  private checkRateLimit(rule: AlertRule): boolean {
    if (!rule.maxAlertsPerWindow || !rule.windowMs) {
      return true;
    }

    const counts = this.windowCounts.get(rule.id) || [];
    const cutoff = Date.now() - rule.windowMs;

    // Remove old timestamps
    const recentCounts = counts.filter(t => t >= cutoff);

    return recentCounts.length < rule.maxAlertsPerWindow;
  }

  /**
   * Update rate limit window.
   */
  private updateRateLimitWindow(rule: AlertRule): void {
    if (!rule.maxAlertsPerWindow || !rule.windowMs) {
      return;
    }

    const counts = this.windowCounts.get(rule.id) || [];
    counts.push(Date.now());

    // Keep only recent timestamps
    const cutoff = Date.now() - rule.windowMs;
    this.windowCounts.set(
      rule.id,
      counts.filter(t => t >= cutoff)
    );
  }

  /**
   * Create an alert from a scoring result.
   */
  private createAlert(result: ScoringResult, rule: AlertRule): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity: rule.severity,
      status: 'active',
      eventId: result.eventId,
      score: result.score,
      confidence: result.confidence,
      algorithm: result.algorithm,
      message: this.generateAlertMessage(result, rule)
    };
  }

  /**
   * Generate alert message.
   */
  private generateAlertMessage(result: ScoringResult, rule: AlertRule): string {
    return `${rule.name}: Anomaly detected with score ${result.score.toFixed(3)} ` +
           `(confidence: ${result.confidence.toFixed(2)}) using ${result.algorithm}`;
  }

  /**
   * Dispatch alert to all enabled channels.
   */
  private async dispatchAlert(alert: Alert): Promise<void> {
    const promises = this.channels
      .filter(c => c.enabled)
      .map(channel => this.sendToChannel(alert, channel));

    await Promise.allSettled(promises);
  }

  /**
   * Send alert to a specific channel.
   */
  private async sendToChannel(alert: Alert, channel: AlertChannelConfig): Promise<void> {
    try {
      switch (channel.type) {
        case 'webhook':
          await this.sendWebhook(alert, channel.config);
          break;
        case 'websocket':
          this.emit('websocket:alert', alert);
          break;
        case 'log':
          console.log(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
          break;
        case 'email':
          // Email implementation would go here
          console.log(`[EMAIL] Alert sent: ${alert.id}`);
          break;
      }
    } catch (error) {
      console.error(`Failed to send alert to ${channel.type}:`, error);
    }
  }

  /**
   * Send webhook notification.
   */
  private async sendWebhook(alert: Alert, config: Record<string, any>): Promise<void> {
    const url = config.url;
    if (!url) return;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(alert)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }

  /**
   * Get severity level as number.
   */
  private getSeverityLevel(severity: AlertSeverity): number {
    const levels: Record<AlertSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    return levels[severity];
  }
}
