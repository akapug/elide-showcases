/**
 * Monitoring Service
 *
 * Comprehensive monitoring and observability for serverless functions.
 * Tracks metrics, logs, cold starts, and costs.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface InvocationMetrics {
  duration: number;
  statusCode: number;
  coldStart: boolean;
  memoryUsed: number;
}

export interface FunctionMetrics {
  functionId: string;
  invocations: number;
  errors: number;
  coldStarts: number;
  avgDuration: number;
  avgColdStartDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  successRate: number;
  errorRate: number;
  coldStartRate: number;
  totalCost: number;
  requestRate: number; // req/s
  lastInvoked?: string;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  functionId: string;
  requestId?: string;
  metadata?: any;
}

export interface CostMetrics {
  invocations: number;
  duration: number; // milliseconds
  memory: number; // MB
  cost: number; // USD
}

export interface ScalingEvent {
  timestamp: string;
  functionId: string;
  action: "scale-up" | "scale-down";
  instances: number;
  reason: string;
}

export interface PlatformMetrics {
  totalFunctions: number;
  totalInvocations: number;
  totalErrors: number;
  avgResponseTime: number;
  totalColdStarts: number;
  avgColdStartTime: number;
  totalCost: number;
  uptime: number;
}

// =============================================================================
// Monitoring Service
// =============================================================================

export class MonitoringService {
  private metrics = new Map<string, FunctionMetrics>();
  private logs = new Map<string, LogEntry[]>();
  private durations = new Map<string, number[]>();
  private coldStartDurations = new Map<string, number[]>();
  private costs = new Map<string, CostMetrics>();
  private scalingEvents = new Map<string, ScalingEvent[]>();
  private rateLimitHits = new Map<string, number>();

  // Configuration
  private readonly maxLogsPerFunction = 1000;
  private readonly maxDurations = 1000;

  // Pricing (AWS Lambda-like pricing for comparison)
  private readonly costPerInvocation = 0.0000002; // $0.20 per 1M requests
  private readonly costPerGbSecond = 0.0000166667; // $16.67 per 1M GB-seconds

  constructor() {
    console.log("[MONITORING] Initializing Monitoring Service...");
    this.startCleanupTask();
  }

  // ==========================================================================
  // Invocation Tracking
  // ==========================================================================

  recordInvocation(functionId: string, invocation: InvocationMetrics): void {
    // Get or create metrics
    let metrics = this.metrics.get(functionId);
    if (!metrics) {
      metrics = {
        functionId,
        invocations: 0,
        errors: 0,
        coldStarts: 0,
        avgDuration: 0,
        avgColdStartDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        successRate: 100,
        errorRate: 0,
        coldStartRate: 0,
        totalCost: 0,
        requestRate: 0,
      };
      this.metrics.set(functionId, metrics);
    }

    // Update invocation count
    metrics.invocations++;
    metrics.lastInvoked = new Date().toISOString();

    // Track errors
    if (invocation.statusCode >= 400) {
      metrics.errors++;
    }

    // Track cold starts
    if (invocation.coldStart) {
      metrics.coldStarts++;

      const coldStartDurations = this.coldStartDurations.get(functionId) || [];
      coldStartDurations.push(invocation.duration);
      if (coldStartDurations.length > this.maxDurations) {
        coldStartDurations.shift();
      }
      this.coldStartDurations.set(functionId, coldStartDurations);

      metrics.avgColdStartDuration = this.calculateAverage(coldStartDurations);
    }

    // Track durations
    const durations = this.durations.get(functionId) || [];
    durations.push(invocation.duration);
    if (durations.length > this.maxDurations) {
      durations.shift();
    }
    this.durations.set(functionId, durations);

    // Update duration metrics
    metrics.avgDuration = this.calculateAverage(durations);
    metrics.minDuration = Math.min(metrics.minDuration, invocation.duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, invocation.duration);
    metrics.p50Duration = this.calculatePercentile(durations, 50);
    metrics.p95Duration = this.calculatePercentile(durations, 95);
    metrics.p99Duration = this.calculatePercentile(durations, 99);

    // Update rates
    metrics.successRate = ((metrics.invocations - metrics.errors) / metrics.invocations) * 100;
    metrics.errorRate = (metrics.errors / metrics.invocations) * 100;
    metrics.coldStartRate = (metrics.coldStarts / metrics.invocations) * 100;

    // Calculate cost
    const cost = this.calculateInvocationCost(invocation);
    metrics.totalCost += cost;

    // Update cost metrics
    const costMetrics = this.costs.get(functionId) || {
      invocations: 0,
      duration: 0,
      memory: 0,
      cost: 0,
    };
    costMetrics.invocations++;
    costMetrics.duration += invocation.duration;
    costMetrics.memory += invocation.memoryUsed;
    costMetrics.cost += cost;
    this.costs.set(functionId, costMetrics);
  }

  // ==========================================================================
  // Cold Start Tracking
  // ==========================================================================

  recordColdStart(functionId: string, duration: number): void {
    this.log(functionId, "info", `Cold start completed in ${duration}ms`, undefined, {
      duration,
      coldStart: true,
    });
  }

  // ==========================================================================
  // Logging
  // ==========================================================================

  log(
    functionId: string,
    level: LogEntry["level"],
    message: string,
    requestId?: string,
    metadata?: any
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      functionId,
      requestId,
      metadata,
    };

    const logs = this.logs.get(functionId) || [];
    logs.push(entry);

    // Keep only recent logs
    if (logs.length > this.maxLogsPerFunction) {
      logs.shift();
    }

    this.logs.set(functionId, logs);

    // Log to console for debugging
    if (process.env.VERBOSE === "true") {
      console.log(`[${level.toUpperCase()}] [${functionId}] ${message}`);
    }
  }

  getFunctionLogs(functionId: string, limit?: number): LogEntry[] {
    const logs = this.logs.get(functionId) || [];
    if (limit) {
      return logs.slice(-limit);
    }
    return logs;
  }

  getLogsByLevel(functionId: string, level: LogEntry["level"]): LogEntry[] {
    const logs = this.logs.get(functionId) || [];
    return logs.filter((log) => log.level === level);
  }

  searchLogs(functionId: string, query: string): LogEntry[] {
    const logs = this.logs.get(functionId) || [];
    const lowerQuery = query.toLowerCase();
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(log.metadata).toLowerCase().includes(lowerQuery)
    );
  }

  // ==========================================================================
  // Metrics Queries
  // ==========================================================================

  getFunctionMetrics(functionId: string): FunctionMetrics | undefined {
    return this.metrics.get(functionId);
  }

  getAllMetrics(): FunctionMetrics[] {
    return Array.from(this.metrics.values());
  }

  getPlatformMetrics(): PlatformMetrics {
    const allMetrics = this.getAllMetrics();

    const totalInvocations = allMetrics.reduce((sum, m) => sum + m.invocations, 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.errors, 0);
    const totalColdStarts = allMetrics.reduce((sum, m) => sum + m.coldStarts, 0);
    const totalCost = allMetrics.reduce((sum, m) => sum + m.totalCost, 0);

    // Calculate weighted average response time
    const avgResponseTime =
      totalInvocations > 0
        ? allMetrics.reduce((sum, m) => sum + m.avgDuration * m.invocations, 0) / totalInvocations
        : 0;

    // Calculate average cold start time across all cold starts
    const avgColdStartTime =
      totalColdStarts > 0
        ? allMetrics.reduce(
            (sum, m) => sum + m.avgColdStartDuration * m.coldStarts,
            0
          ) / totalColdStarts
        : 0;

    return {
      totalFunctions: allMetrics.length,
      totalInvocations,
      totalErrors,
      avgResponseTime: Math.round(avgResponseTime),
      totalColdStarts,
      avgColdStartTime: Math.round(avgColdStartTime),
      totalCost: Math.round(totalCost * 1000000) / 1000000, // Round to 6 decimals
      uptime: process.uptime(),
    };
  }

  // ==========================================================================
  // Cost Tracking
  // ==========================================================================

  private calculateInvocationCost(invocation: InvocationMetrics): number {
    // Cost per invocation
    const invocationCost = this.costPerInvocation;

    // Cost per GB-second
    const gbSeconds = (invocation.memoryUsed / 1024) * (invocation.duration / 1000);
    const computeCost = gbSeconds * this.costPerGbSecond;

    return invocationCost + computeCost;
  }

  getCostMetrics(functionId: string): CostMetrics | undefined {
    return this.costs.get(functionId);
  }

  getAllCosts(): Record<string, CostMetrics> {
    const costs: Record<string, CostMetrics> = {};
    for (const [functionId, metrics] of this.costs.entries()) {
      costs[functionId] = metrics;
    }
    return costs;
  }

  getTotalCost(): number {
    let total = 0;
    for (const metrics of this.costs.values()) {
      total += metrics.cost;
    }
    return total;
  }

  // ==========================================================================
  // Scaling Events
  // ==========================================================================

  recordScalingEvent(
    functionId: string,
    action: "scale-up" | "scale-down",
    instances: number,
    reason: string
  ): void {
    const event: ScalingEvent = {
      timestamp: new Date().toISOString(),
      functionId,
      action,
      instances,
      reason,
    };

    const events = this.scalingEvents.get(functionId) || [];
    events.push(event);

    // Keep only recent events
    if (events.length > 100) {
      events.shift();
    }

    this.scalingEvents.set(functionId, events);

    this.log(functionId, "info", `Scaling ${action}: ${instances} instances (${reason})`);
  }

  getScalingEvents(functionId: string): ScalingEvent[] {
    return this.scalingEvents.get(functionId) || [];
  }

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  recordRateLimitHit(functionId: string): void {
    const hits = this.rateLimitHits.get(functionId) || 0;
    this.rateLimitHits.set(functionId, hits + 1);

    this.log(functionId, "warn", "Rate limit exceeded");
  }

  getRateLimitHits(functionId: string): number {
    return this.rateLimitHits.get(functionId) || 0;
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  getTopFunctions(limit = 10): FunctionMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.invocations - a.invocations)
      .slice(0, limit);
  }

  getSlowestFunctions(limit = 10): FunctionMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  getMostExpensiveFunctions(limit = 10): FunctionMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  getFunctionsWithHighErrorRate(threshold = 5): FunctionMetrics[] {
    return this.getAllMetrics().filter((m) => m.errorRate > threshold);
  }

  getFunctionsWithHighColdStartRate(threshold = 10): FunctionMetrics[] {
    return this.getAllMetrics().filter((m) => m.coldStartRate > threshold);
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    metrics: {
      avgResponseTime: number;
      errorRate: number;
      coldStartRate: number;
    };
  } {
    const platform = this.getPlatformMetrics();
    const issues: string[] = [];

    // Check error rate
    const errorRate =
      platform.totalInvocations > 0
        ? (platform.totalErrors / platform.totalInvocations) * 100
        : 0;

    // Check cold start rate
    const coldStartRate =
      platform.totalInvocations > 0
        ? (platform.totalColdStarts / platform.totalInvocations) * 100
        : 0;

    // Determine health status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (errorRate > 5) {
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
      status = "degraded";
    }

    if (errorRate > 10) {
      status = "unhealthy";
    }

    if (platform.avgResponseTime > 1000) {
      issues.push(`High response time: ${platform.avgResponseTime}ms`);
      status = "degraded";
    }

    if (coldStartRate > 20) {
      issues.push(`High cold start rate: ${coldStartRate.toFixed(2)}%`);
      if (status === "healthy") {
        status = "degraded";
      }
    }

    return {
      status,
      issues,
      metrics: {
        avgResponseTime: platform.avgResponseTime,
        errorRate,
        coldStartRate,
      },
    };
  }

  // ==========================================================================
  // Alerts
  // ==========================================================================

  checkAlerts(): Array<{
    functionId: string;
    severity: "warning" | "critical";
    message: string;
  }> {
    const alerts: Array<{
      functionId: string;
      severity: "warning" | "critical";
      message: string;
    }> = [];

    for (const metrics of this.getAllMetrics()) {
      // High error rate
      if (metrics.errorRate > 10) {
        alerts.push({
          functionId: metrics.functionId,
          severity: "critical",
          message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
        });
      } else if (metrics.errorRate > 5) {
        alerts.push({
          functionId: metrics.functionId,
          severity: "warning",
          message: `Elevated error rate: ${metrics.errorRate.toFixed(2)}%`,
        });
      }

      // Slow response times
      if (metrics.p95Duration > 2000) {
        alerts.push({
          functionId: metrics.functionId,
          severity: "critical",
          message: `Slow p95 response time: ${metrics.p95Duration}ms`,
        });
      } else if (metrics.p95Duration > 1000) {
        alerts.push({
          functionId: metrics.functionId,
          severity: "warning",
          message: `Elevated p95 response time: ${metrics.p95Duration}ms`,
        });
      }

      // High cold start rate
      if (metrics.coldStartRate > 30) {
        alerts.push({
          functionId: metrics.functionId,
          severity: "warning",
          message: `High cold start rate: ${metrics.coldStartRate.toFixed(2)}%`,
        });
      }
    }

    return alerts;
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanup();
    }, 3600000); // Run every hour
  }

  private cleanup(): void {
    // Clean up old logs (keep only last 1000 per function)
    for (const [functionId, logs] of this.logs.entries()) {
      if (logs.length > this.maxLogsPerFunction) {
        this.logs.set(functionId, logs.slice(-this.maxLogsPerFunction));
      }
    }

    // Clean up old durations
    for (const [functionId, durations] of this.durations.entries()) {
      if (durations.length > this.maxDurations) {
        this.durations.set(functionId, durations.slice(-this.maxDurations));
      }
    }

    console.log("[MONITORING] Cleanup completed");
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  exportMetrics(): {
    functions: FunctionMetrics[];
    platform: PlatformMetrics;
    costs: Record<string, CostMetrics>;
    health: ReturnType<MonitoringService["getHealthStatus"]>;
  } {
    return {
      functions: this.getAllMetrics(),
      platform: this.getPlatformMetrics(),
      costs: this.getAllCosts(),
      health: this.getHealthStatus(),
    };
  }
}
