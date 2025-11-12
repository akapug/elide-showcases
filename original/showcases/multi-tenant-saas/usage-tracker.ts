/**
 * Usage Tracker - Advanced usage metering and quota management
 *
 * Features:
 * - Real-time usage tracking
 * - Multiple metric types
 * - Quota enforcement
 * - Usage alerts
 * - Historical analytics
 * - Rate limiting
 * - Cost estimation
 *
 * @module usage-tracker
 */

export enum MetricType {
  API_CALLS = 'api_calls',
  STORAGE = 'storage',
  BANDWIDTH = 'bandwidth',
  COMPUTE_TIME = 'compute_time',
  DATABASE_QUERIES = 'database_queries',
  ACTIVE_USERS = 'active_users',
  PROJECTS = 'projects',
  REQUESTS = 'requests',
  TRANSACTIONS = 'transactions'
}

export enum QuotaStatus {
  OK = 'ok',
  WARNING = 'warning',    // 80-100% of quota
  EXCEEDED = 'exceeded',  // >100% of quota
  CRITICAL = 'critical'   // Significantly exceeded
}

export interface UsageMetric {
  tenantId: string;
  metricType: MetricType;
  value: number;
  period: string; // YYYY-MM-DD or YYYY-MM
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface Quota {
  metricType: MetricType;
  limit: number;
  period: 'daily' | 'monthly' | 'total';
  softLimit?: number; // Warning threshold
  resetAt?: number;
}

export interface QuotaCheck {
  metricType: MetricType;
  current: number;
  limit: number;
  percentage: number;
  status: QuotaStatus;
  remaining: number;
  resetAt?: number;
  exceeded: boolean;
}

export interface UsageAlert {
  id: string;
  tenantId: string;
  metricType: MetricType;
  threshold: number;
  currentValue: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggered: boolean;
  triggeredAt?: number;
  acknowledged: boolean;
}

export interface UsageReport {
  tenantId: string;
  period: string;
  metrics: Record<MetricType, number>;
  quotaChecks: QuotaCheck[];
  alerts: UsageAlert[];
  cost: number;
  trends: {
    metricType: MetricType;
    change: number;
    percentage: number;
  }[];
}

/**
 * Advanced Usage Tracker
 */
export class AdvancedUsageTracker {
  private metrics: Map<string, UsageMetric[]>;
  private quotas: Map<string, Quota[]>;
  private alerts: Map<string, UsageAlert[]>;
  private rateLimits: Map<string, RateLimitState>;

  constructor() {
    this.metrics = new Map();
    this.quotas = new Map();
    this.alerts = new Map();
    this.rateLimits = new Map();
  }

  /**
   * Track usage
   */
  track(
    tenantId: string,
    metricType: MetricType,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const period = this.getCurrentPeriod();
    const metric: UsageMetric = {
      tenantId,
      metricType,
      value,
      period,
      timestamp: Date.now(),
      metadata
    };

    const key = this.getMetricKey(tenantId, metricType, period);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(metric);

    // Check quotas
    this.checkQuotas(tenantId);

    // Check alerts
    this.checkAlerts(tenantId, metricType);
  }

  /**
   * Increment metric
   */
  increment(
    tenantId: string,
    metricType: MetricType,
    amount: number = 1,
    metadata?: Record<string, any>
  ): void {
    this.track(tenantId, metricType, amount, metadata);
  }

  /**
   * Decrement metric (e.g., for storage deletion)
   */
  decrement(
    tenantId: string,
    metricType: MetricType,
    amount: number = 1,
    metadata?: Record<string, any>
  ): void {
    this.track(tenantId, metricType, -amount, metadata);
  }

  /**
   * Set absolute value for metric
   */
  set(
    tenantId: string,
    metricType: MetricType,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const period = this.getCurrentPeriod();
    const key = this.getMetricKey(tenantId, metricType, period);

    // Clear existing metrics for this period
    this.metrics.set(key, [{
      tenantId,
      metricType,
      value,
      period,
      timestamp: Date.now(),
      metadata
    }]);

    this.checkQuotas(tenantId);
    this.checkAlerts(tenantId, metricType);
  }

  /**
   * Get current usage for a metric
   */
  getUsage(
    tenantId: string,
    metricType: MetricType,
    period?: string
  ): number {
    period = period || this.getCurrentPeriod();
    const key = this.getMetricKey(tenantId, metricType, period);
    const metrics = this.metrics.get(key) || [];

    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  /**
   * Get all usage metrics for tenant
   */
  getAllUsage(tenantId: string, period?: string): Record<MetricType, number> {
    period = period || this.getCurrentPeriod();
    const usage: Record<string, number> = {};

    for (const metricType of Object.values(MetricType)) {
      usage[metricType] = this.getUsage(tenantId, metricType, period);
    }

    return usage as Record<MetricType, number>;
  }

  /**
   * Set quota for tenant
   */
  setQuota(
    tenantId: string,
    quota: Quota
  ): void {
    if (!this.quotas.has(tenantId)) {
      this.quotas.set(tenantId, []);
    }

    const quotas = this.quotas.get(tenantId)!;
    const existing = quotas.findIndex(q => q.metricType === quota.metricType);

    if (existing >= 0) {
      quotas[existing] = quota;
    } else {
      quotas.push(quota);
    }

    // Set reset time if not provided
    if (!quota.resetAt) {
      quota.resetAt = this.calculateResetTime(quota.period);
    }
  }

  /**
   * Set multiple quotas
   */
  setQuotas(tenantId: string, quotas: Quota[]): void {
    this.quotas.set(tenantId, quotas);

    // Calculate reset times
    for (const quota of quotas) {
      if (!quota.resetAt) {
        quota.resetAt = this.calculateResetTime(quota.period);
      }
    }
  }

  /**
   * Check if usage exceeds quotas
   */
  checkQuotas(tenantId: string): QuotaCheck[] {
    const quotas = this.quotas.get(tenantId) || [];
    const checks: QuotaCheck[] = [];

    for (const quota of quotas) {
      const current = this.getUsage(tenantId, quota.metricType);
      const percentage = (current / quota.limit) * 100;

      let status = QuotaStatus.OK;
      if (percentage >= 120) {
        status = QuotaStatus.CRITICAL;
      } else if (percentage > 100) {
        status = QuotaStatus.EXCEEDED;
      } else if (percentage >= 80) {
        status = QuotaStatus.WARNING;
      }

      checks.push({
        metricType: quota.metricType,
        current,
        limit: quota.limit,
        percentage,
        status,
        remaining: Math.max(0, quota.limit - current),
        resetAt: quota.resetAt,
        exceeded: percentage > 100
      });
    }

    return checks;
  }

  /**
   * Check if tenant can perform action based on quota
   */
  canPerformAction(
    tenantId: string,
    metricType: MetricType,
    amount: number = 1
  ): { allowed: boolean; reason?: string; check?: QuotaCheck } {
    const quotas = this.quotas.get(tenantId) || [];
    const quota = quotas.find(q => q.metricType === metricType);

    if (!quota) {
      return { allowed: true };
    }

    const current = this.getUsage(tenantId, metricType);
    const newTotal = current + amount;

    if (newTotal > quota.limit) {
      const check: QuotaCheck = {
        metricType,
        current,
        limit: quota.limit,
        percentage: (current / quota.limit) * 100,
        status: QuotaStatus.EXCEEDED,
        remaining: 0,
        exceeded: true
      };

      return {
        allowed: false,
        reason: `Quota exceeded for ${metricType}. Current: ${current}, Limit: ${quota.limit}`,
        check
      };
    }

    return { allowed: true };
  }

  /**
   * Create usage alert
   */
  createAlert(
    tenantId: string,
    metricType: MetricType,
    threshold: number,
    severity: 'info' | 'warning' | 'critical'
  ): UsageAlert {
    const alert: UsageAlert = {
      id: this.generateId('alert'),
      tenantId,
      metricType,
      threshold,
      currentValue: this.getUsage(tenantId, metricType),
      message: `Usage alert: ${metricType} threshold ${threshold} reached`,
      severity,
      triggered: false,
      acknowledged: false
    };

    if (!this.alerts.has(tenantId)) {
      this.alerts.set(tenantId, []);
    }

    this.alerts.get(tenantId)!.push(alert);
    return alert;
  }

  /**
   * Check alerts and trigger if threshold exceeded
   */
  private checkAlerts(tenantId: string, metricType: MetricType): void {
    const alerts = this.alerts.get(tenantId) || [];
    const currentValue = this.getUsage(tenantId, metricType);

    for (const alert of alerts) {
      if (alert.metricType !== metricType) continue;
      if (alert.triggered && !alert.acknowledged) continue;

      if (currentValue >= alert.threshold) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        alert.currentValue = currentValue;
        this.notifyAlert(alert);
      }
    }
  }

  /**
   * Get active alerts
   */
  getAlerts(tenantId: string, onlyTriggered: boolean = false): UsageAlert[] {
    const alerts = this.alerts.get(tenantId) || [];
    return onlyTriggered ? alerts.filter(a => a.triggered && !a.acknowledged) : alerts;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    for (const alerts of this.alerts.values()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        break;
      }
    }
  }

  /**
   * Rate limiting
   */
  checkRateLimit(
    tenantId: string,
    action: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; retryAfter?: number; remaining: number } {
    const key = `${tenantId}:${action}`;
    const now = Date.now();

    let state = this.rateLimits.get(key);

    if (!state || now > state.resetAt) {
      state = {
        count: 0,
        resetAt: now + windowMs
      };
      this.rateLimits.set(key, state);
    }

    state.count++;

    if (state.count > limit) {
      return {
        allowed: false,
        retryAfter: state.resetAt - now,
        remaining: 0
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - state.count)
    };
  }

  /**
   * Generate usage report
   */
  generateReport(tenantId: string, period?: string): UsageReport {
    period = period || this.getCurrentPeriod();
    const metrics = this.getAllUsage(tenantId, period);
    const quotaChecks = this.checkQuotas(tenantId);
    const alerts = this.getAlerts(tenantId, true);

    // Calculate cost based on usage
    const cost = this.calculateCost(tenantId, metrics);

    // Calculate trends
    const previousPeriod = this.getPreviousPeriod(period);
    const previousMetrics = this.getAllUsage(tenantId, previousPeriod);
    const trends = this.calculateTrends(metrics, previousMetrics);

    return {
      tenantId,
      period,
      metrics,
      quotaChecks,
      alerts,
      cost,
      trends
    };
  }

  /**
   * Get usage history
   */
  getHistory(
    tenantId: string,
    metricType: MetricType,
    days: number = 30
  ): { date: string; value: number }[] {
    const history: { date: string; value: number }[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const period = this.formatDate(date);
      const value = this.getUsage(tenantId, metricType, period);

      history.unshift({ date: period, value });
    }

    return history;
  }

  /**
   * Reset usage for period
   */
  reset(tenantId: string, metricType?: MetricType): void {
    if (metricType) {
      const period = this.getCurrentPeriod();
      const key = this.getMetricKey(tenantId, metricType, period);
      this.metrics.delete(key);
    } else {
      // Reset all metrics for tenant
      for (const key of Array.from(this.metrics.keys())) {
        if (key.startsWith(tenantId)) {
          this.metrics.delete(key);
        }
      }
    }
  }

  /**
   * Export usage data
   */
  export(tenantId: string, startDate: string, endDate: string): UsageMetric[] {
    const exported: UsageMetric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (!key.startsWith(tenantId)) continue;

      for (const metric of metrics) {
        if (metric.period >= startDate && metric.period <= endDate) {
          exported.push(metric);
        }
      }
    }

    return exported;
  }

  // Helper methods
  private getMetricKey(tenantId: string, metricType: MetricType, period: string): string {
    return `${tenantId}:${metricType}:${period}`;
  }

  private getCurrentPeriod(): string {
    return this.formatDate(new Date());
  }

  private getPreviousPeriod(period: string): string {
    const date = new Date(period);
    date.setMonth(date.getMonth() - 1);
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calculateResetTime(period: 'daily' | 'monthly' | 'total'): number {
    const now = new Date();

    if (period === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime();
    } else if (period === 'monthly') {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.getTime();
    }

    return -1; // No reset for 'total'
  }

  private calculateCost(tenantId: string, metrics: Record<MetricType, number>): number {
    // Cost calculation based on usage
    const pricing = {
      [MetricType.API_CALLS]: 0.0001,      // $0.0001 per call
      [MetricType.STORAGE]: 0.00000002,     // $0.02 per GB
      [MetricType.BANDWIDTH]: 0.00000001,   // $0.01 per GB
      [MetricType.COMPUTE_TIME]: 0.001,     // $0.001 per second
      [MetricType.DATABASE_QUERIES]: 0.00001 // $0.00001 per query
    };

    let cost = 0;
    for (const [metricType, value] of Object.entries(metrics)) {
      const price = pricing[metricType as MetricType] || 0;
      cost += value * price;
    }

    return Math.round(cost * 100) / 100; // Round to 2 decimals
  }

  private calculateTrends(
    current: Record<MetricType, number>,
    previous: Record<MetricType, number>
  ): { metricType: MetricType; change: number; percentage: number }[] {
    const trends: { metricType: MetricType; change: number; percentage: number }[] = [];

    for (const [metricType, currentValue] of Object.entries(current)) {
      const previousValue = previous[metricType as MetricType] || 0;
      const change = currentValue - previousValue;
      const percentage = previousValue > 0 ? (change / previousValue) * 100 : 0;

      trends.push({
        metricType: metricType as MetricType,
        change,
        percentage: Math.round(percentage * 100) / 100
      });
    }

    return trends;
  }

  private notifyAlert(alert: UsageAlert): void {
    console.log(`Alert triggered: ${alert.message}`, {
      tenantId: alert.tenantId,
      severity: alert.severity,
      threshold: alert.threshold,
      currentValue: alert.currentValue
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface RateLimitState {
  count: number;
  resetAt: number;
}
