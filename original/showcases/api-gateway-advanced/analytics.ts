/**
 * Analytics & Monitoring Module
 *
 * Provides comprehensive analytics and monitoring:
 * - Request/response metrics
 * - Performance tracking
 * - Error tracking and logging
 * - Alert system
 * - Real-time monitoring
 * - Custom events tracking
 */

// ==================== Types & Interfaces ====================

export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  bytesIn: number;
  bytesOut: number;
  cached: boolean;
  error?: string;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

export interface Alert {
  id: string;
  type: 'error_rate' | 'response_time' | 'rate_limit' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
  acknowledged: boolean;
}

export interface AlertRule {
  id: string;
  type: 'error_rate' | 'response_time' | 'rate_limit' | 'custom';
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldownMs: number;
  lastTriggered?: number;
}

export interface AnalyticsSnapshot {
  timestamp: number;
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  topErrors: Array<{ error: string; count: number }>;
}

// ==================== Metrics Collector ====================

export class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private maxMetrics: number = 10000;
  private aggregationWindow: number = 60000; // 1 minute

  /**
   * Record a request metric
   */
  recordRequest(metric: RequestMetrics): void {
    this.metrics.push(metric);

    // Cleanup old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics for a time range
   */
  getMetrics(startTime?: number, endTime?: number): RequestMetrics[] {
    const start = startTime || 0;
    const end = endTime || Date.now();

    return this.metrics.filter(m => m.timestamp >= start && m.timestamp <= end);
  }

  /**
   * Get performance metrics for an endpoint
   */
  getEndpointMetrics(endpoint: string, method?: string): PerformanceMetrics | null {
    const endpointMetrics = this.metrics.filter(
      m => m.path === endpoint && (!method || m.method === method)
    );

    if (endpointMetrics.length === 0) {
      return null;
    }

    const durations = endpointMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = endpointMetrics.filter(m => m.statusCode >= 400);

    return {
      endpoint,
      method: method || 'ALL',
      avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: durations[0],
      maxResponseTime: durations[durations.length - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      requestCount: endpointMetrics.length,
      errorCount: errors.length,
      errorRate: errors.length / endpointMetrics.length
    };
  }

  /**
   * Get overall performance metrics
   */
  getOverallMetrics(windowMs?: number): PerformanceMetrics {
    const now = Date.now();
    const window = windowMs || this.aggregationWindow;
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < window);

    if (recentMetrics.length === 0) {
      return {
        endpoint: 'ALL',
        method: 'ALL',
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        requestCount: 0,
        errorCount: 0,
        errorRate: 0
      };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = recentMetrics.filter(m => m.statusCode >= 400);

    return {
      endpoint: 'ALL',
      method: 'ALL',
      avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: durations[0],
      maxResponseTime: durations[durations.length - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      requestCount: recentMetrics.length,
      errorCount: errors.length,
      errorRate: errors.length / recentMetrics.length
    };
  }

  /**
   * Get top endpoints by request count
   */
  getTopEndpoints(limit: number = 10, windowMs?: number): Array<{ endpoint: string; count: number }> {
    const now = Date.now();
    const window = windowMs || this.aggregationWindow;
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < window);

    const endpointCounts = new Map<string, number>();

    for (const metric of recentMetrics) {
      const key = `${metric.method} ${metric.path}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    }

    return Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get requests per second
   */
  getRequestsPerSecond(windowMs?: number): number {
    const now = Date.now();
    const window = windowMs || 60000; // Default 1 minute
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < window);

    return recentMetrics.length / (window / 1000);
  }

  /**
   * Clear old metrics
   */
  cleanup(olderThan?: number): void {
    const threshold = olderThan || Date.now() - 3600000; // Default 1 hour
    this.metrics = this.metrics.filter(m => m.timestamp > threshold);
  }

  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

// ==================== Logger ====================

export class Logger {
  private logs: ErrorLog[] = [];
  private maxLogs: number = 5000;

  /**
   * Log an error
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log('error', message, context, error);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Get logs
   */
  getLogs(level?: 'error' | 'warn' | 'info', limit?: number): ErrorLog[] {
    let filtered = level ? this.logs.filter(log => log.level === level) : this.logs;

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Search logs
   */
  searchLogs(query: string): ErrorLog[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(
      log =>
        log.message.toLowerCase().includes(lowerQuery) ||
        (log.stack && log.stack.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Clear old logs
   */
  cleanup(olderThan?: number): void {
    const threshold = olderThan || Date.now() - 86400000; // Default 24 hours
    this.logs = this.logs.filter(log => log.timestamp > threshold);

    // Also enforce max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private log(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>, error?: Error): void {
    const log: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      message,
      context,
      stack: error?.stack
    };

    this.logs.push(log);

    // Cleanup if needed
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console[level](`[${level.toUpperCase()}] ${message}${contextStr}`);
    if (error?.stack) {
      console.error(error.stack);
    }
  }
}

// ==================== Alert Manager ====================

export class AlertManager {
  private alerts: Alert[] = [];
  private rules: Map<string, AlertRule> = new Map();
  private maxAlerts: number = 1000;

  /**
   * Add alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Check rules and trigger alerts
   */
  checkRules(metrics: any): Alert[] {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();

    for (const rule of this.rules.values()) {
      // Check cooldown
      if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldownMs) {
        continue;
      }

      // Check condition
      if (rule.condition(metrics)) {
        const alert = this.createAlert(rule);
        triggeredAlerts.push(alert);
        rule.lastTriggered = now;
      }
    }

    return triggeredAlerts;
  }

  /**
   * Create an alert
   */
  createAlert(rule: AlertRule, metadata?: Record<string, any>): Alert {
    const alert: Alert = {
      id: crypto.randomUUID(),
      type: rule.type,
      severity: rule.severity,
      message: rule.message,
      timestamp: Date.now(),
      metadata,
      acknowledged: false
    };

    this.alerts.push(alert);

    // Cleanup old alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): Alert[] {
    let filtered = this.alerts.filter(a => !a.acknowledged);

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    return filtered;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit?: number): Alert[] {
    if (limit) {
      return this.alerts.slice(-limit);
    }
    return this.alerts;
  }

  /**
   * Clear old alerts
   */
  cleanup(olderThan?: number): void {
    const threshold = olderThan || Date.now() - 86400000; // Default 24 hours
    this.alerts = this.alerts.filter(a => a.timestamp > threshold || !a.acknowledged);
  }
}

// ==================== Analytics Service ====================

export class AnalyticsService {
  private metricsCollector: MetricsCollector;
  private logger: Logger;
  private alertManager: AlertManager;
  private snapshotInterval: any;

  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.logger = new Logger();
    this.alertManager = new AlertManager();

    this.initializeDefaultRules();
    this.startMonitoring();
  }

  /**
   * Record a request
   */
  recordRequest(metric: RequestMetrics): void {
    this.metricsCollector.recordRequest(metric);

    // Log errors
    if (metric.statusCode >= 500) {
      this.logger.error(`Server error on ${metric.method} ${metric.path}`, {
        requestId: metric.requestId,
        statusCode: metric.statusCode,
        error: metric.error
      });
    } else if (metric.statusCode >= 400) {
      this.logger.warn(`Client error on ${metric.method} ${metric.path}`, {
        requestId: metric.requestId,
        statusCode: metric.statusCode
      });
    }
  }

  /**
   * Get analytics snapshot
   */
  getSnapshot(windowMs?: number): AnalyticsSnapshot {
    const overall = this.metricsCollector.getOverallMetrics(windowMs);
    const topEndpoints = this.metricsCollector.getTopEndpoints(10, windowMs);
    const recentErrors = this.logger.getLogs('error', 100);

    // Count error types
    const errorCounts = new Map<string, number>();
    for (const log of recentErrors) {
      const error = log.message;
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    }

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      timestamp: Date.now(),
      totalRequests: overall.requestCount,
      totalErrors: overall.errorCount,
      avgResponseTime: overall.avgResponseTime,
      requestsPerSecond: this.metricsCollector.getRequestsPerSecond(windowMs),
      errorRate: overall.errorRate,
      topEndpoints,
      topErrors
    };
  }

  /**
   * Get endpoint metrics
   */
  getEndpointMetrics(endpoint: string, method?: string): PerformanceMetrics | null {
    return this.metricsCollector.getEndpointMetrics(endpoint, method);
  }

  /**
   * Get overall metrics
   */
  getOverallMetrics(windowMs?: number): PerformanceMetrics {
    return this.metricsCollector.getOverallMetrics(windowMs);
  }

  /**
   * Track custom event
   */
  trackEvent(event: string, data?: Record<string, any>): void {
    this.logger.info(`Event: ${event}`, data);
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get alert manager
   */
  getAlertManager(): AlertManager {
    return this.alertManager;
  }

  /**
   * Get metrics collector
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  private initializeDefaultRules(): void {
    // High error rate alert
    this.alertManager.addRule({
      id: 'high-error-rate',
      type: 'error_rate',
      severity: 'high',
      message: 'Error rate exceeds 10%',
      cooldownMs: 300000, // 5 minutes
      condition: (metrics: PerformanceMetrics) => metrics.errorRate > 0.1
    });

    // Slow response time alert
    this.alertManager.addRule({
      id: 'slow-response',
      type: 'response_time',
      severity: 'medium',
      message: 'Average response time exceeds 1 second',
      cooldownMs: 300000,
      condition: (metrics: PerformanceMetrics) => metrics.avgResponseTime > 1000
    });

    // Very slow response time alert
    this.alertManager.addRule({
      id: 'very-slow-response',
      type: 'response_time',
      severity: 'high',
      message: 'P95 response time exceeds 3 seconds',
      cooldownMs: 300000,
      condition: (metrics: PerformanceMetrics) => metrics.p95 > 3000
    });
  }

  private startMonitoring(): void {
    // Check alerts every minute
    this.snapshotInterval = setInterval(() => {
      const metrics = this.metricsCollector.getOverallMetrics();
      const alerts = this.alertManager.checkRules(metrics);

      for (const alert of alerts) {
        this.logger.error(`Alert triggered: ${alert.message}`, {
          severity: alert.severity,
          type: alert.type
        });
      }

      // Cleanup old data
      this.metricsCollector.cleanup();
      this.logger.cleanup();
      this.alertManager.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Shutdown analytics service
   */
  shutdown(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
  }
}
