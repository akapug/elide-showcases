/**
 * Metrics Exporter - Prometheus Metrics
 *
 * Comprehensive metrics collection and export:
 * - Controller performance metrics
 * - Resource state metrics
 * - Reconciliation metrics
 * - Event metrics
 * - Custom business metrics
 * - Prometheus-compatible export format
 */

import { IncomingMessage, ServerResponse } from "http";

// ============================================================================
// Type Definitions
// ============================================================================

export enum MetricType {
  Counter = "counter",
  Gauge = "gauge",
  Histogram = "histogram",
  Summary = "summary",
}

export interface Metric {
  name: string;
  type: MetricType;
  help: string;
  labels?: string[];
  values: Map<string, number | HistogramValue>;
}

export interface HistogramValue {
  count: number;
  sum: number;
  buckets: Map<number, number>;
}

export interface MetricLabels {
  [key: string]: string;
}

// ============================================================================
// Metrics Registry
// ============================================================================

export class MetricsRegistry {
  private metrics = new Map<string, Metric>();
  private defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

  /**
   * Register a counter metric
   */
  registerCounter(name: string, help: string, labels: string[] = []): void {
    this.metrics.set(name, {
      name,
      type: MetricType.Counter,
      help,
      labels,
      values: new Map(),
    });
  }

  /**
   * Register a gauge metric
   */
  registerGauge(name: string, help: string, labels: string[] = []): void {
    this.metrics.set(name, {
      name,
      type: MetricType.Gauge,
      help,
      labels,
      values: new Map(),
    });
  }

  /**
   * Register a histogram metric
   */
  registerHistogram(
    name: string,
    help: string,
    labels: string[] = [],
    buckets: number[] = this.defaultBuckets
  ): void {
    this.metrics.set(name, {
      name,
      type: MetricType.Histogram,
      help,
      labels,
      values: new Map(),
    });
  }

  /**
   * Increment counter
   */
  inc(name: string, labels: MetricLabels = {}, value = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.Counter) {
      console.warn(`[METRICS] Counter ${name} not found`);
      return;
    }

    const key = this.getLabelKey(labels);
    const current = (metric.values.get(key) as number) || 0;
    metric.values.set(key, current + value);
  }

  /**
   * Set gauge value
   */
  set(name: string, value: number, labels: MetricLabels = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.Gauge) {
      console.warn(`[METRICS] Gauge ${name} not found`);
      return;
    }

    const key = this.getLabelKey(labels);
    metric.values.set(key, value);
  }

  /**
   * Increment gauge
   */
  incGauge(name: string, labels: MetricLabels = {}, value = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.Gauge) {
      console.warn(`[METRICS] Gauge ${name} not found`);
      return;
    }

    const key = this.getLabelKey(labels);
    const current = (metric.values.get(key) as number) || 0;
    metric.values.set(key, current + value);
  }

  /**
   * Decrement gauge
   */
  dec(name: string, labels: MetricLabels = {}, value = 1): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.Gauge) {
      console.warn(`[METRICS] Gauge ${name} not found`);
      return;
    }

    const key = this.getLabelKey(labels);
    const current = (metric.values.get(key) as number) || 0;
    metric.values.set(key, current - value);
  }

  /**
   * Observe histogram value
   */
  observe(name: string, value: number, labels: MetricLabels = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== MetricType.Histogram) {
      console.warn(`[METRICS] Histogram ${name} not found`);
      return;
    }

    const key = this.getLabelKey(labels);
    let histogram = metric.values.get(key) as HistogramValue;

    if (!histogram) {
      histogram = {
        count: 0,
        sum: 0,
        buckets: new Map(this.defaultBuckets.map(b => [b, 0])),
      };
      metric.values.set(key, histogram);
    }

    histogram.count++;
    histogram.sum += value;

    // Update buckets
    for (const bucket of this.defaultBuckets) {
      if (value <= bucket) {
        const current = histogram.buckets.get(bucket) || 0;
        histogram.buckets.set(bucket, current + 1);
      }
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    for (const metric of this.metrics.values()) {
      metric.values.clear();
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  export(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      // Add HELP line
      lines.push(`# HELP ${metric.name} ${metric.help}`);

      // Add TYPE line
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      // Add metric values
      for (const [labelKey, value] of metric.values.entries()) {
        if (metric.type === MetricType.Histogram) {
          const histogram = value as HistogramValue;

          // Add bucket values
          for (const [bucket, count] of histogram.buckets.entries()) {
            const labels = this.formatLabels(labelKey, { le: bucket.toString() });
            lines.push(`${metric.name}_bucket${labels} ${count}`);
          }

          // Add +Inf bucket
          const labels = this.formatLabels(labelKey, { le: "+Inf" });
          lines.push(`${metric.name}_bucket${labels} ${histogram.count}`);

          // Add sum
          const sumLabels = this.formatLabels(labelKey);
          lines.push(`${metric.name}_sum${sumLabels} ${histogram.sum}`);

          // Add count
          lines.push(`${metric.name}_count${sumLabels} ${histogram.count}`);
        } else {
          const labels = this.formatLabels(labelKey);
          lines.push(`${metric.name}${labels} ${value}`);
        }
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Get label key for storage
   */
  private getLabelKey(labels: MetricLabels): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([k, v]) => `${k}="${v}"`).join(",");
  }

  /**
   * Format labels for Prometheus output
   */
  private formatLabels(labelKey: string, extraLabels: MetricLabels = {}): string {
    if (!labelKey && Object.keys(extraLabels).length === 0) {
      return "";
    }

    const allLabels = labelKey ? labelKey.split(",") : [];
    const extraEntries = Object.entries(extraLabels).map(([k, v]) => `${k}="${v}"`);
    const combined = [...allLabels, ...extraEntries];

    return combined.length > 0 ? `{${combined.join(",")}}` : "";
  }
}

// ============================================================================
// Metrics Exporter
// ============================================================================

export class MetricsExporter {
  private registry: MetricsRegistry;
  private startTime = Date.now();

  constructor() {
    this.registry = new MetricsRegistry();
    this.registerDefaultMetrics();
  }

  /**
   * Register default operator metrics
   */
  private registerDefaultMetrics(): void {
    // Controller metrics
    this.registry.registerCounter(
      "controller_reconcile_total",
      "Total number of reconciliations",
      ["controller", "result"]
    );

    this.registry.registerCounter(
      "controller_reconcile_errors_total",
      "Total number of reconciliation errors",
      ["controller"]
    );

    this.registry.registerHistogram(
      "controller_reconcile_duration_seconds",
      "Duration of reconciliation in seconds",
      ["controller"]
    );

    // Resource metrics
    this.registry.registerGauge(
      "resource_count",
      "Number of managed resources",
      ["kind", "namespace"]
    );

    this.registry.registerGauge(
      "resource_phase_count",
      "Number of resources by phase",
      ["kind", "phase"]
    );

    // Event metrics
    this.registry.registerCounter(
      "event_total",
      "Total number of events recorded",
      ["type", "severity"]
    );

    // Webhook metrics
    this.registry.registerCounter(
      "webhook_requests_total",
      "Total number of webhook requests",
      ["webhook", "operation", "allowed"]
    );

    this.registry.registerHistogram(
      "webhook_duration_seconds",
      "Duration of webhook processing in seconds",
      ["webhook"]
    );

    // Leader election metrics
    this.registry.registerGauge(
      "leader_election_status",
      "Leader election status (1=leader, 0=follower)",
      []
    );

    this.registry.registerCounter(
      "leader_transitions_total",
      "Total number of leader transitions",
      []
    );

    // Queue metrics
    this.registry.registerGauge(
      "workqueue_depth",
      "Current depth of work queue",
      ["name"]
    );

    this.registry.registerCounter(
      "workqueue_adds_total",
      "Total number of items added to work queue",
      ["name"]
    );

    this.registry.registerCounter(
      "workqueue_retries_total",
      "Total number of retries in work queue",
      ["name"]
    );

    // Process metrics
    this.registry.registerGauge(
      "process_start_time_seconds",
      "Start time of the process since unix epoch in seconds",
      []
    );

    this.registry.set("process_start_time_seconds", this.startTime / 1000);
  }

  /**
   * Get metrics registry
   */
  getRegistry(): MetricsRegistry {
    return this.registry;
  }

  /**
   * Handle metrics request
   */
  handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (url.pathname === "/metrics" && req.method === "GET") {
      const metrics = this.registry.export();
      res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
      res.end(metrics);
    } else if (url.pathname === "/healthz" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    }
  }
}

// ============================================================================
// Metrics Helpers
// ============================================================================

/**
 * Timer for measuring duration
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Observe duration in histogram
   */
  observeDuration(registry: MetricsRegistry, metricName: string, labels: MetricLabels = {}): void {
    const duration = (Date.now() - this.startTime) / 1000; // Convert to seconds
    registry.observe(metricName, duration, labels);
  }

  /**
   * Get elapsed time in seconds
   */
  elapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }
}

/**
 * Start a timer for a metric
 */
export function startTimer(): Timer {
  return new Timer();
}

/**
 * Wrap function with metrics
 */
export function withMetrics<T>(
  registry: MetricsRegistry,
  metricName: string,
  labels: MetricLabels,
  fn: () => Promise<T>
): Promise<T> {
  const timer = startTimer();

  return fn()
    .then(result => {
      timer.observeDuration(registry, metricName, { ...labels, result: "success" });
      registry.inc(`${metricName}_total`, { ...labels, result: "success" });
      return result;
    })
    .catch(error => {
      timer.observeDuration(registry, metricName, { ...labels, result: "error" });
      registry.inc(`${metricName}_total`, { ...labels, result: "error" });
      registry.inc(`${metricName}_errors_total`, labels);
      throw error;
    });
}

// ============================================================================
// Example Usage
// ============================================================================

export class ControllerMetrics {
  private registry: MetricsRegistry;
  private controllerName: string;

  constructor(registry: MetricsRegistry, controllerName: string) {
    this.registry = registry;
    this.controllerName = controllerName;
  }

  /**
   * Record reconciliation
   */
  recordReconciliation(success: boolean, duration: number): void {
    const labels = {
      controller: this.controllerName,
      result: success ? "success" : "error",
    };

    this.registry.inc("controller_reconcile_total", labels);
    this.registry.observe("controller_reconcile_duration_seconds", duration, {
      controller: this.controllerName,
    });

    if (!success) {
      this.registry.inc("controller_reconcile_errors_total", {
        controller: this.controllerName,
      });
    }
  }

  /**
   * Set resource count
   */
  setResourceCount(kind: string, namespace: string, count: number): void {
    this.registry.set("resource_count", count, { kind, namespace });
  }

  /**
   * Set resource phase count
   */
  setResourcePhaseCount(kind: string, phase: string, count: number): void {
    this.registry.set("resource_phase_count", count, { kind, phase });
  }

  /**
   * Record event
   */
  recordEvent(type: string, severity: string): void {
    this.registry.inc("event_total", { type, severity });
  }

  /**
   * Record webhook request
   */
  recordWebhookRequest(webhook: string, operation: string, allowed: boolean, duration: number): void {
    this.registry.inc("webhook_requests_total", {
      webhook,
      operation,
      allowed: allowed.toString(),
    });

    this.registry.observe("webhook_duration_seconds", duration, { webhook });
  }

  /**
   * Set leader status
   */
  setLeaderStatus(isLeader: boolean): void {
    this.registry.set("leader_election_status", isLeader ? 1 : 0);
  }

  /**
   * Record leader transition
   */
  recordLeaderTransition(): void {
    this.registry.inc("leader_transitions_total");
  }

  /**
   * Set queue depth
   */
  setQueueDepth(queueName: string, depth: number): void {
    this.registry.set("workqueue_depth", depth, { name: queueName });
  }

  /**
   * Record queue add
   */
  recordQueueAdd(queueName: string): void {
    this.registry.inc("workqueue_adds_total", { name: queueName });
  }

  /**
   * Record queue retry
   */
  recordQueueRetry(queueName: string): void {
    this.registry.inc("workqueue_retries_total", { name: queueName });
  }
}
