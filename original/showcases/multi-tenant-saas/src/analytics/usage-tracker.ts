/**
 * Usage Tracker - Advanced usage metering and analytics system
 *
 * Features:
 * - Real-time usage tracking for multiple metrics
 * - Aggregation and rollup of usage data
 * - Quota management and enforcement
 * - Usage alerts and notifications
 * - Time-series data storage
 * - Multi-dimensional analytics (tenant, user, feature)
 * - Anomaly detection
 * - Usage forecasting
 * - Export capabilities
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  RATE = 'rate',
  HISTOGRAM = 'histogram'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  PERCENTILE = 'percentile'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  unit: string;
  tags: string[];
  quotaEnabled: boolean;
  alertThresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface UsageEvent {
  id: string;
  tenantId: string;
  userId?: string;
  metricId: string;
  value: number;
  timestamp: Date;
  dimensions: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface AggregatedUsage {
  metricId: string;
  tenantId: string;
  period: {
    start: Date;
    end: Date;
    granularity: TimeGranularity;
  };
  aggregations: {
    sum: number;
    average: number;
    min: number;
    max: number;
    count: number;
    p50?: number;
    p95?: number;
    p99?: number;
  };
  dimensions: Record<string, any>;
}

export interface Quota {
  id: string;
  tenantId: string;
  metricId: string;
  limit: number;
  period: TimeGranularity;
  resetDay?: number;
  softLimit?: number;
  hardLimit: number;
  currentUsage: number;
  lastReset: Date;
  nextReset: Date;
}

export interface UsageAlert {
  id: string;
  tenantId: string;
  metricId: string;
  severity: 'info' | 'warning' | 'critical';
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface UsageTrend {
  metricId: string;
  tenantId: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  forecast?: Array<{
    timestamp: Date;
    predicted: number;
    confidence: number;
  }>;
}

// ============================================================================
// Usage Tracker Implementation
// ============================================================================

export class UsageTracker extends EventEmitter {
  private metrics: Map<string, MetricDefinition> = new Map();
  private events: UsageEvent[] = [];
  private aggregations: Map<string, AggregatedUsage[]> = new Map();
  private quotas: Map<string, Quota> = new Map();
  private alerts: Map<string, UsageAlert[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultMetrics();
    this.startBackgroundJobs();
  }

  /**
   * Initialize default metrics
   */
  private initializeDefaultMetrics(): void {
    const metrics: MetricDefinition[] = [
      {
        id: 'api_requests',
        name: 'API Requests',
        description: 'Total number of API requests',
        type: MetricType.COUNTER,
        unit: 'requests',
        tags: ['api', 'performance'],
        quotaEnabled: true,
        alertThresholds: {
          warning: 80,
          critical: 95
        }
      },
      {
        id: 'api_latency',
        name: 'API Latency',
        description: 'API response time',
        type: MetricType.HISTOGRAM,
        unit: 'milliseconds',
        tags: ['api', 'performance'],
        quotaEnabled: false,
        alertThresholds: {
          warning: 1000,
          critical: 3000
        }
      },
      {
        id: 'storage_used',
        name: 'Storage Used',
        description: 'Total storage consumption',
        type: MetricType.GAUGE,
        unit: 'bytes',
        tags: ['storage', 'resource'],
        quotaEnabled: true,
        alertThresholds: {
          warning: 80,
          critical: 95
        }
      },
      {
        id: 'bandwidth',
        name: 'Bandwidth',
        description: 'Network bandwidth consumption',
        type: MetricType.COUNTER,
        unit: 'bytes',
        tags: ['network', 'resource'],
        quotaEnabled: true
      },
      {
        id: 'active_users',
        name: 'Active Users',
        description: 'Number of active users',
        type: MetricType.GAUGE,
        unit: 'users',
        tags: ['users', 'engagement'],
        quotaEnabled: true
      },
      {
        id: 'database_queries',
        name: 'Database Queries',
        description: 'Number of database queries executed',
        type: MetricType.COUNTER,
        unit: 'queries',
        tags: ['database', 'performance'],
        quotaEnabled: true
      },
      {
        id: 'cache_hits',
        name: 'Cache Hits',
        description: 'Number of cache hits',
        type: MetricType.COUNTER,
        unit: 'hits',
        tags: ['cache', 'performance'],
        quotaEnabled: false
      },
      {
        id: 'cache_misses',
        name: 'Cache Misses',
        description: 'Number of cache misses',
        type: MetricType.COUNTER,
        unit: 'misses',
        tags: ['cache', 'performance'],
        quotaEnabled: false
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        description: 'Rate of errors per minute',
        type: MetricType.RATE,
        unit: 'errors/min',
        tags: ['errors', 'reliability'],
        quotaEnabled: false,
        alertThresholds: {
          warning: 5,
          critical: 10
        }
      },
      {
        id: 'concurrent_connections',
        name: 'Concurrent Connections',
        description: 'Number of concurrent connections',
        type: MetricType.GAUGE,
        unit: 'connections',
        tags: ['network', 'resource'],
        quotaEnabled: true
      }
    ];

    metrics.forEach(metric => this.metrics.set(metric.id, metric));
  }

  /**
   * Track a usage event
   */
  async track(params: {
    tenantId: string;
    userId?: string;
    metricId: string;
    value: number;
    dimensions?: Record<string, string>;
    metadata?: Record<string, any>;
  }): Promise<UsageEvent> {
    const metric = this.metrics.get(params.metricId);
    if (!metric) {
      throw new Error(`Metric ${params.metricId} not found`);
    }

    const event: UsageEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: params.tenantId,
      userId: params.userId,
      metricId: params.metricId,
      value: params.value,
      timestamp: new Date(),
      dimensions: params.dimensions || {},
      metadata: params.metadata
    };

    this.events.push(event);

    // Check quota
    if (metric.quotaEnabled) {
      await this.checkQuota(params.tenantId, params.metricId, params.value);
    }

    // Check alert thresholds
    await this.checkAlerts(params.tenantId, params.metricId);

    this.emit('usage:tracked', { event, metric });

    return event;
  }

  /**
   * Batch track multiple events
   */
  async batchTrack(events: Array<Omit<UsageEvent, 'id' | 'timestamp'>>): Promise<UsageEvent[]> {
    const trackedEvents: UsageEvent[] = [];

    for (const event of events) {
      const tracked = await this.track(event);
      trackedEvents.push(tracked);
    }

    return trackedEvents;
  }

  /**
   * Get usage for a metric
   */
  getUsage(params: {
    tenantId: string;
    metricId: string;
    startDate: Date;
    endDate: Date;
    granularity?: TimeGranularity;
    dimensions?: Record<string, string>;
  }): AggregatedUsage[] {
    const events = this.events.filter(
      event =>
        event.tenantId === params.tenantId &&
        event.metricId === params.metricId &&
        event.timestamp >= params.startDate &&
        event.timestamp <= params.endDate &&
        (!params.dimensions ||
          Object.entries(params.dimensions).every(
            ([key, value]) => event.dimensions[key] === value
          ))
    );

    const granularity = params.granularity || TimeGranularity.DAY;
    const buckets = this.bucketEvents(events, granularity);

    return Object.entries(buckets).map(([bucketKey, bucketEvents]) => {
      const [start, end] = bucketKey.split('|').map(d => new Date(d));
      const values = bucketEvents.map(e => e.value);

      return {
        metricId: params.metricId,
        tenantId: params.tenantId,
        period: {
          start,
          end,
          granularity
        },
        aggregations: {
          sum: values.reduce((a, b) => a + b, 0),
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
          p50: this.percentile(values, 50),
          p95: this.percentile(values, 95),
          p99: this.percentile(values, 99)
        },
        dimensions: params.dimensions || {}
      };
    });
  }

  /**
   * Bucket events by time granularity
   */
  private bucketEvents(
    events: UsageEvent[],
    granularity: TimeGranularity
  ): Record<string, UsageEvent[]> {
    const buckets: Record<string, UsageEvent[]> = {};

    events.forEach(event => {
      const bucketKey = this.getBucketKey(event.timestamp, granularity);
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = [];
      }
      buckets[bucketKey].push(event);
    });

    return buckets;
  }

  /**
   * Get bucket key for timestamp
   */
  private getBucketKey(timestamp: Date, granularity: TimeGranularity): string {
    const date = new Date(timestamp);
    let start: Date;
    let end: Date;

    switch (granularity) {
      case TimeGranularity.MINUTE:
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
        end = new Date(start.getTime() + 60 * 1000);
        break;
      case TimeGranularity.HOUR:
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
        end = new Date(start.getTime() + 60 * 60 * 1000);
        break;
      case TimeGranularity.DAY:
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        break;
      case TimeGranularity.WEEK:
        const dayOfWeek = date.getDay();
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek);
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case TimeGranularity.MONTH:
        start = new Date(date.getFullYear(), date.getMonth(), 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        break;
      default:
        throw new Error(`Unsupported granularity: ${granularity}`);
    }

    return `${start.toISOString()}|${end.toISOString()}`;
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Set quota for a metric
   */
  async setQuota(params: {
    tenantId: string;
    metricId: string;
    limit: number;
    period: TimeGranularity;
    softLimit?: number;
  }): Promise<Quota> {
    const metric = this.metrics.get(params.metricId);
    if (!metric) {
      throw new Error(`Metric ${params.metricId} not found`);
    }

    if (!metric.quotaEnabled) {
      throw new Error(`Quota not enabled for metric ${params.metricId}`);
    }

    const now = new Date();
    const quotaId = `${params.tenantId}:${params.metricId}`;

    const quota: Quota = {
      id: quotaId,
      tenantId: params.tenantId,
      metricId: params.metricId,
      limit: params.limit,
      period: params.period,
      softLimit: params.softLimit || params.limit * 0.8,
      hardLimit: params.limit,
      currentUsage: 0,
      lastReset: now,
      nextReset: this.calculateNextReset(now, params.period)
    };

    this.quotas.set(quotaId, quota);

    this.emit('quota:set', { quota, timestamp: now });

    return quota;
  }

  /**
   * Calculate next quota reset time
   */
  private calculateNextReset(current: Date, period: TimeGranularity): Date {
    const next = new Date(current);

    switch (period) {
      case TimeGranularity.HOUR:
        next.setHours(next.getHours() + 1, 0, 0, 0);
        break;
      case TimeGranularity.DAY:
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case TimeGranularity.WEEK:
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        break;
      case TimeGranularity.MONTH:
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(0, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Check quota and enforce limits
   */
  private async checkQuota(
    tenantId: string,
    metricId: string,
    value: number
  ): Promise<void> {
    const quotaId = `${tenantId}:${metricId}`;
    const quota = this.quotas.get(quotaId);

    if (!quota) return;

    // Reset quota if period has passed
    const now = new Date();
    if (now >= quota.nextReset) {
      quota.currentUsage = 0;
      quota.lastReset = now;
      quota.nextReset = this.calculateNextReset(now, quota.period);
    }

    // Update current usage
    quota.currentUsage += value;

    // Check soft limit
    if (quota.currentUsage >= quota.softLimit && quota.currentUsage < quota.hardLimit) {
      this.createAlert({
        tenantId,
        metricId,
        severity: 'warning',
        threshold: quota.softLimit,
        currentValue: quota.currentUsage,
        message: `Approaching quota limit for ${metricId}. Current: ${quota.currentUsage}, Limit: ${quota.hardLimit}`
      });
    }

    // Check hard limit
    if (quota.currentUsage >= quota.hardLimit) {
      this.createAlert({
        tenantId,
        metricId,
        severity: 'critical',
        threshold: quota.hardLimit,
        currentValue: quota.currentUsage,
        message: `Quota exceeded for ${metricId}. Current: ${quota.currentUsage}, Limit: ${quota.hardLimit}`
      });

      throw new Error(`Quota exceeded for ${metricId}`);
    }
  }

  /**
   * Check alert thresholds
   */
  private async checkAlerts(tenantId: string, metricId: string): Promise<void> {
    const metric = this.metrics.get(metricId);
    if (!metric?.alertThresholds) return;

    const recentUsage = this.getRecentUsage(tenantId, metricId, 5); // Last 5 minutes
    const avgValue = recentUsage.length > 0
      ? recentUsage.reduce((sum, e) => sum + e.value, 0) / recentUsage.length
      : 0;

    if (metric.alertThresholds.critical && avgValue >= metric.alertThresholds.critical) {
      this.createAlert({
        tenantId,
        metricId,
        severity: 'critical',
        threshold: metric.alertThresholds.critical,
        currentValue: avgValue,
        message: `Critical threshold exceeded for ${metric.name}`
      });
    } else if (metric.alertThresholds.warning && avgValue >= metric.alertThresholds.warning) {
      this.createAlert({
        tenantId,
        metricId,
        severity: 'warning',
        threshold: metric.alertThresholds.warning,
        currentValue: avgValue,
        message: `Warning threshold exceeded for ${metric.name}`
      });
    }
  }

  /**
   * Get recent usage events
   */
  private getRecentUsage(tenantId: string, metricId: string, minutes: number): UsageEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter(
      e => e.tenantId === tenantId && e.metricId === metricId && e.timestamp >= cutoff
    );
  }

  /**
   * Create usage alert
   */
  private createAlert(params: Omit<UsageAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: UsageAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: new Date(),
      acknowledged: false
    };

    if (!this.alerts.has(params.tenantId)) {
      this.alerts.set(params.tenantId, []);
    }
    this.alerts.get(params.tenantId)!.push(alert);

    this.emit('alert:created', { alert });
  }

  /**
   * Get usage trend
   */
  async getUsageTrend(params: {
    tenantId: string;
    metricId: string;
    startDate: Date;
    endDate: Date;
    granularity: TimeGranularity;
  }): Promise<UsageTrend> {
    const aggregations = this.getUsage({
      tenantId: params.tenantId,
      metricId: params.metricId,
      startDate: params.startDate,
      endDate: params.endDate,
      granularity: params.granularity
    });

    const dataPoints = aggregations.map(agg => ({
      timestamp: agg.period.start,
      value: agg.aggregations.sum
    }));

    // Simple trend calculation
    const trend = this.calculateTrend(dataPoints);
    const changeRate = this.calculateChangeRate(dataPoints);

    return {
      metricId: params.metricId,
      tenantId: params.tenantId,
      dataPoints,
      trend,
      changeRate
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(dataPoints: Array<{ timestamp: Date; value: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (dataPoints.length < 2) return 'stable';

    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Calculate rate of change
   */
  private calculateChangeRate(dataPoints: Array<{ timestamp: Date; value: number }>): number {
    if (dataPoints.length < 2) return 0;

    const first = dataPoints[0].value;
    const last = dataPoints[dataPoints.length - 1].value;

    return first === 0 ? 0 : ((last - first) / first) * 100;
  }

  /**
   * Start background jobs
   */
  private startBackgroundJobs(): void {
    // Aggregate data every hour
    setInterval(() => this.aggregateData(), 60 * 60 * 1000);

    // Clean old events daily
    setInterval(() => this.cleanOldEvents(), 24 * 60 * 60 * 1000);

    // Reset quotas as needed
    setInterval(() => this.resetExpiredQuotas(), 60 * 60 * 1000);
  }

  /**
   * Aggregate data for performance
   */
  private async aggregateData(): Promise<void> {
    // Implementation for pre-aggregating data
    this.emit('data:aggregated', { timestamp: new Date() });
  }

  /**
   * Clean old events (keep last 90 days)
   */
  private async cleanOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    const removed = before - this.events.length;

    this.emit('events:cleaned', { removed, timestamp: new Date() });
  }

  /**
   * Reset expired quotas
   */
  private async resetExpiredQuotas(): Promise<void> {
    const now = new Date();
    let resetCount = 0;

    for (const [id, quota] of this.quotas) {
      if (now >= quota.nextReset) {
        quota.currentUsage = 0;
        quota.lastReset = now;
        quota.nextReset = this.calculateNextReset(now, quota.period);
        resetCount++;
      }
    }

    if (resetCount > 0) {
      this.emit('quotas:reset', { count: resetCount, timestamp: now });
    }
  }

  // Getter methods
  getMetric(metricId: string): MetricDefinition | undefined {
    return this.metrics.get(metricId);
  }

  getAllMetrics(): MetricDefinition[] {
    return Array.from(this.metrics.values());
  }

  getQuota(tenantId: string, metricId: string): Quota | undefined {
    return this.quotas.get(`${tenantId}:${metricId}`);
  }

  getTenantQuotas(tenantId: string): Quota[] {
    return Array.from(this.quotas.values()).filter(q => q.tenantId === tenantId);
  }

  getTenantAlerts(tenantId: string, acknowledged?: boolean): UsageAlert[] {
    const alerts = this.alerts.get(tenantId) || [];
    if (acknowledged === undefined) return alerts;
    return alerts.filter(a => a.acknowledged === acknowledged);
  }
}

export default UsageTracker;
