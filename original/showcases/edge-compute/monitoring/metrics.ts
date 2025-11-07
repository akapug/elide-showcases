/**
 * Metrics Service - Collects and aggregates performance metrics
 *
 * Tracks function execution, errors, latency, and resource usage.
 */

import { EventEmitter } from 'events';

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  unit?: string;
}

export interface AggregatedMetric {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  labels?: Record<string, string>;
}

export interface MetricsSummary {
  requests: {
    total: number;
    success: number;
    error: number;
    rate: number; // requests per second
  };
  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  functions: {
    total: number;
    active: number;
    executions: number;
  };
  errors: {
    total: number;
    rate: number;
    byType: Record<string, number>;
  };
}

export class MetricsService extends EventEmitter {
  private metrics: Map<string, Metric[]>;
  private counters: Map<string, number>;
  private gauges: Map<string, number>;
  private histograms: Map<string, number[]>;
  private startTime: Date;

  constructor() {
    super();
    this.metrics = new Map();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = new Date();

    this.startAggregation();
  }

  /**
   * Record a metric
   */
  record(name: string, value: number, labels?: Record<string, string>, unit?: string): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      labels,
      unit,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Keep only last 1000 metrics per name
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.shift();
    }

    this.emit('metric', metric);
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.record(name, current + value, labels, 'count');
  }

  /**
   * Decrement a counter
   */
  decrement(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.increment(name, -value, labels);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);

    this.record(name, value, labels, 'gauge');
  }

  /**
   * Record histogram value
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);

    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }

    this.histograms.get(key)!.push(value);

    // Keep only last 1000 values
    const values = this.histograms.get(key)!;
    if (values.length > 1000) {
      values.shift();
    }

    this.record(name, value, labels, 'histogram');
  }

  /**
   * Record timing
   */
  timing(name: string, duration: number, labels?: Record<string, string>): void {
    this.histogram(name, duration, labels);
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number | undefined {
    const key = this.buildKey(name, labels);
    return this.gauges.get(key);
  }

  /**
   * Get aggregated metrics
   */
  getAggregated(
    name: string,
    timeRange?: { start: Date; end: Date }
  ): AggregatedMetric | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    let filtered = metrics;

    if (timeRange) {
      filtered = metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filtered.length === 0) return null;

    const values = filtered.map((m) => m.value).sort((a, b) => a - b);

    return {
      name,
      count: values.length,
      sum: values.reduce((sum, v) => sum + v, 0),
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
    };
  }

  /**
   * Get metrics summary
   */
  getSummary(): MetricsSummary {
    const requestsTotal = this.getCounter('requests.total') || 0;
    const requestsSuccess = this.getCounter('requests.success') || 0;
    const requestsError = this.getCounter('requests.error') || 0;

    const uptimeSeconds = (Date.now() - this.startTime.getTime()) / 1000;
    const requestRate = requestsTotal / uptimeSeconds;

    const latencyMetric = this.getAggregated('execution.duration');

    const functionsTotal = this.getGauge('functions.total') || 0;
    const functionsActive = this.getGauge('functions.active') || 0;
    const executionsTotal = this.getCounter('executions.total') || 0;

    const errorsTotal = this.getCounter('errors.total') || 0;
    const errorRate = errorsTotal / uptimeSeconds;

    // Get errors by type
    const errorsByType: Record<string, number> = {};
    for (const [key, value] of this.counters.entries()) {
      if (key.startsWith('errors.type:')) {
        const type = key.split(':')[1];
        errorsByType[type] = value;
      }
    }

    return {
      requests: {
        total: requestsTotal,
        success: requestsSuccess,
        error: requestsError,
        rate: requestRate,
      },
      latency: {
        avg: latencyMetric?.avg || 0,
        p50: latencyMetric?.p50 || 0,
        p95: latencyMetric?.p95 || 0,
        p99: latencyMetric?.p99 || 0,
      },
      functions: {
        total: functionsTotal,
        active: functionsActive,
        executions: executionsTotal,
      },
      errors: {
        total: errorsTotal,
        rate: errorRate,
        byType: errorsByType,
      },
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, Metric[]> {
    const result: Record<string, Metric[]> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = [...metrics];
    }

    return result;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();

    this.emit('clear');
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      const [name, labels] = this.parseKey(key);
      const labelStr = labels ? `{${labels}}` : '';
      lines.push(`${name}${labelStr} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      const [name, labels] = this.parseKey(key);
      const labelStr = labels ? `{${labels}}` : '';
      lines.push(`${name}${labelStr} ${value}`);
    }

    // Export histograms
    for (const [key, values] of this.histograms.entries()) {
      const [name, labels] = this.parseKey(key);
      const labelStr = labels ? `{${labels}}` : '';

      const sorted = values.slice().sort((a, b) => a - b);
      lines.push(`${name}_count${labelStr} ${values.length}`);
      lines.push(`${name}_sum${labelStr} ${values.reduce((sum, v) => sum + v, 0)}`);
      lines.push(`${name}_p50${labelStr} ${this.percentile(sorted, 50)}`);
      lines.push(`${name}_p95${labelStr} ${this.percentile(sorted, 95)}`);
      lines.push(`${name}_p99${labelStr} ${this.percentile(sorted, 99)}`);
    }

    return lines.join('\n');
  }

  // Private methods

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  private parseKey(key: string): [string, string | undefined] {
    const match = key.match(/^([^{]+)(\{.*\})?$/);
    if (!match) return [key, undefined];

    return [match[1], match[2]];
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;

    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private startAggregation(): void {
    // Periodically clean old metrics
    setInterval(() => {
      const cutoff = new Date(Date.now() - 3600000); // 1 hour ago

      for (const [name, metrics] of this.metrics.entries()) {
        const filtered = metrics.filter((m) => m.timestamp >= cutoff);
        this.metrics.set(name, filtered);
      }
    }, 300000); // Every 5 minutes
  }
}

export default MetricsService;
