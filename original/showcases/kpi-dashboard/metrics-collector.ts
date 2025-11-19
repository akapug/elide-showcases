/**
 * Metrics Collection System
 *
 * Automatically tracks KPIs and performance metrics for the Elide runtime,
 * storing historical data and calculating statistics.
 */

interface RequestMetrics {
  total: number;
  byPath: Map<string, number>;
  byMethod: Map<string, number>;
  errors: number;
  lastRequests: Array<{
    path: string;
    method: string;
    timestamp: number;
    duration?: number;
  }>;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  responseTimes: number[];
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage?: number;
  uptime: number;
  timestamp: number;
}

interface ErrorMetrics {
  total: number;
  byType: Map<string, number>;
  recentErrors: Array<{
    error: string;
    timestamp: number;
    stack?: string;
  }>;
}

export class MetricsCollector {
  private startTime: number;
  private requests: RequestMetrics;
  private performance: PerformanceMetrics;
  private errors: ErrorMetrics;
  private systemMetrics: SystemMetrics[];
  private maxHistorySize: number = 1000;
  private maxResponseTimes: number = 10000;

  constructor() {
    this.startTime = Date.now();
    this.requests = {
      total: 0,
      byPath: new Map(),
      byMethod: new Map(),
      errors: 0,
      lastRequests: [],
    };
    this.performance = {
      avgResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      responseTimes: [],
    };
    this.errors = {
      total: 0,
      byType: new Map(),
      recentErrors: [],
    };
    this.systemMetrics = [];

    // Start collecting system metrics periodically
    this.startSystemMetricsCollection();
  }

  /**
   * Track an incoming request
   */
  trackRequest(path: string, method: string = "GET"): void {
    this.requests.total++;

    // Track by path
    const pathCount = this.requests.byPath.get(path) || 0;
    this.requests.byPath.set(path, pathCount + 1);

    // Track by method
    const methodCount = this.requests.byMethod.get(method) || 0;
    this.requests.byMethod.set(method, methodCount + 1);

    // Store recent request
    this.requests.lastRequests.push({
      path,
      method,
      timestamp: Date.now(),
    });

    // Keep only last N requests
    if (this.requests.lastRequests.length > this.maxHistorySize) {
      this.requests.lastRequests.shift();
    }
  }

  /**
   * Track request response time
   */
  trackResponseTime(duration: number): void {
    this.performance.responseTimes.push(duration);

    // Keep only last N response times
    if (this.performance.responseTimes.length > this.maxResponseTimes) {
      this.performance.responseTimes.shift();
    }

    // Recalculate percentiles
    this.calculatePercentiles();
  }

  /**
   * Track an error
   */
  trackError(error: Error): void {
    this.requests.errors++;
    this.errors.total++;

    const errorType = error.constructor.name;
    const typeCount = this.errors.byType.get(errorType) || 0;
    this.errors.byType.set(errorType, typeCount + 1);

    this.errors.recentErrors.push({
      error: error.message,
      timestamp: Date.now(),
      stack: error.stack,
    });

    // Keep only last N errors
    if (this.errors.recentErrors.length > this.maxHistorySize) {
      this.errors.recentErrors.shift();
    }
  }

  /**
   * Get current uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get all current metrics
   */
  getCurrentMetrics(): any {
    return {
      timestamp: Date.now(),
      uptime: this.getUptime(),
      requests: {
        total: this.requests.total,
        errors: this.requests.errors,
        errorRate: this.requests.total > 0
          ? (this.requests.errors / this.requests.total) * 100
          : 0,
        byPath: Object.fromEntries(this.requests.byPath),
        byMethod: Object.fromEntries(this.requests.byMethod),
        recent: this.requests.lastRequests.slice(-10),
      },
      performance: {
        avgResponseTime: this.performance.avgResponseTime,
        p50: this.performance.p50,
        p95: this.performance.p95,
        p99: this.performance.p99,
        sampleSize: this.performance.responseTimes.length,
      },
      errors: {
        total: this.errors.total,
        byType: Object.fromEntries(this.errors.byType),
        recent: this.errors.recentErrors.slice(-5),
      },
      system: this.getLatestSystemMetrics(),
      history: {
        requestsPerMinute: this.calculateRequestsPerMinute(),
        systemMetricsHistory: this.systemMetrics.slice(-60), // Last 60 samples
      },
    };
  }

  /**
   * Calculate percentiles from response times
   */
  private calculatePercentiles(): void {
    if (this.performance.responseTimes.length === 0) {
      return;
    }

    const sorted = [...this.performance.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    this.performance.avgResponseTime =
      sorted.reduce((a, b) => a + b, 0) / len;

    this.performance.p50 = sorted[Math.floor(len * 0.50)];
    this.performance.p95 = sorted[Math.floor(len * 0.95)];
    this.performance.p99 = sorted[Math.floor(len * 0.99)];
  }

  /**
   * Calculate requests per minute
   */
  private calculateRequestsPerMinute(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requests.lastRequests.filter(
      req => req.timestamp > oneMinuteAgo
    );
    return recentRequests.length;
  }

  /**
   * Get latest system metrics
   */
  private getLatestSystemMetrics(): SystemMetrics | null {
    if (this.systemMetrics.length === 0) {
      return null;
    }
    return this.systemMetrics[this.systemMetrics.length - 1];
  }

  /**
   * Start periodic system metrics collection
   */
  private startSystemMetricsCollection(): void {
    const collectMetrics = () => {
      const memUsage = (performance as any).memory?.usedJSHeapSize || 0;

      const metrics: SystemMetrics = {
        memoryUsage: memUsage,
        uptime: this.getUptime(),
        timestamp: Date.now(),
      };

      this.systemMetrics.push(metrics);

      // Keep only last N samples
      if (this.systemMetrics.length > this.maxHistorySize) {
        this.systemMetrics.shift();
      }
    };

    // Collect metrics every 5 seconds
    setInterval(collectMetrics, 5000);

    // Collect initial metrics
    collectMetrics();
  }

  /**
   * Export metrics to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.getCurrentMetrics(), null, 2);
  }

  /**
   * Get metrics summary for logging
   */
  getSummary(): string {
    const uptime = Math.floor(this.getUptime() / 1000);
    const rps = this.requests.total / uptime;
    const errorRate = this.requests.total > 0
      ? ((this.requests.errors / this.requests.total) * 100).toFixed(2)
      : "0.00";

    return `
┌─────────────────────────────────────────┐
│         METRICS SUMMARY                 │
├─────────────────────────────────────────┤
│ Uptime:        ${uptime}s
│ Total Requests: ${this.requests.total}
│ Requests/sec:   ${rps.toFixed(2)}
│ Error Rate:     ${errorRate}%
│ Avg Response:   ${this.performance.avgResponseTime.toFixed(2)}ms
│ P95 Response:   ${this.performance.p95.toFixed(2)}ms
└─────────────────────────────────────────┘
    `.trim();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.startTime = Date.now();
    this.requests = {
      total: 0,
      byPath: new Map(),
      byMethod: new Map(),
      errors: 0,
      lastRequests: [],
    };
    this.performance = {
      avgResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      responseTimes: [],
    };
    this.errors = {
      total: 0,
      byType: new Map(),
      recentErrors: [],
    };
    this.systemMetrics = [];
  }

  /**
   * Get specific metric by name
   */
  getMetric(name: string): any {
    const metrics = this.getCurrentMetrics();
    const parts = name.split(".");

    let value = metrics;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Get historical trend for a metric
   */
  getHistoricalTrend(metricName: string, samples: number = 10): number[] {
    // For now, return the last N samples from system metrics
    return this.systemMetrics
      .slice(-samples)
      .map(m => m.memoryUsage);
  }

  /**
   * Check if any alerts should be triggered
   */
  checkAlerts(): Array<{ severity: string; message: string }> {
    const alerts = [];

    // High error rate
    const errorRate = this.requests.total > 0
      ? (this.requests.errors / this.requests.total) * 100
      : 0;

    if (errorRate > 5) {
      alerts.push({
        severity: "warning",
        message: `High error rate: ${errorRate.toFixed(2)}%`,
      });
    }

    if (errorRate > 10) {
      alerts.push({
        severity: "critical",
        message: `Critical error rate: ${errorRate.toFixed(2)}%`,
      });
    }

    // High response time
    if (this.performance.p95 > 1000) {
      alerts.push({
        severity: "warning",
        message: `High P95 response time: ${this.performance.p95.toFixed(2)}ms`,
      });
    }

    // High memory usage
    const latestMemory = this.getLatestSystemMetrics();
    if (latestMemory && latestMemory.memoryUsage > 500 * 1024 * 1024) {
      alerts.push({
        severity: "warning",
        message: `High memory usage: ${(latestMemory.memoryUsage / 1024 / 1024).toFixed(0)}MB`,
      });
    }

    return alerts;
  }
}

export default MetricsCollector;
