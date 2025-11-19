/**
 * Prometheus Registry Implementation
 *
 * Manages collection and serialization of metrics
 */

import type { Metric, MetricJSON, LabelValues, Registry as IRegistry } from './types';

/**
 * Registry for collecting and managing metrics
 */
export class Registry implements IRegistry {
  private metrics: Map<string, Metric> = new Map();
  private defaultLabels: LabelValues = {};
  private contentTypeValue: string =
    'text/plain; version=0.0.4; charset=utf-8';

  /**
   * Register a metric
   */
  registerMetric(metric: Metric): void {
    if (this.metrics.has(metric.name)) {
      throw new Error(`Metric ${metric.name} is already registered`);
    }
    this.metrics.set(metric.name, metric);
  }

  /**
   * Get a single metric by name
   */
  getSingleMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Remove a single metric by name
   */
  removeSingleMetric(name: string): void {
    this.metrics.delete(name);
  }

  /**
   * Get all metrics in Prometheus text format
   */
  async metrics(): Promise<string> {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      // Call collect function if it exists
      if (metric.collect) {
        await metric.collect();
      }

      // Serialize metric
      const serialized = metric.serialize();
      if (serialized) {
        lines.push(serialized);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Get all metrics as JSON
   */
  async getMetricsAsJSON(): Promise<MetricJSON[]> {
    const result: MetricJSON[] = [];

    for (const metric of this.metrics.values()) {
      // Call collect function if it exists
      if (metric.collect) {
        await metric.collect();
      }

      const value = metric.get();

      result.push({
        name: metric.name,
        help: metric.help,
        type: metric.type,
        values: Array.isArray(value) ? value : [value],
      });
    }

    return result;
  }

  /**
   * Reset all metrics to their initial state
   */
  resetMetrics(): void {
    for (const metric of this.metrics.values()) {
      metric.reset();
    }
  }

  /**
   * Remove all metrics from the registry
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Set default labels that will be applied to all metrics
   */
  setDefaultLabels(labels: LabelValues): void {
    this.defaultLabels = { ...labels };
  }

  /**
   * Get default labels
   */
  getDefaultLabels(): LabelValues {
    return { ...this.defaultLabels };
  }

  /**
   * Get content type for HTTP responses
   */
  get contentType(): string {
    return this.contentTypeValue;
  }

  /**
   * Set content type
   */
  setContentType(type: string): void {
    this.contentTypeValue = type;
  }

  /**
   * Get number of registered metrics
   */
  get size(): number {
    return this.metrics.size;
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Merge metrics from another registry
   */
  merge(registry: Registry): void {
    for (const [name, metric] of registry.metrics.entries()) {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, metric);
      }
    }
  }
}

/**
 * Default global registry
 */
export const register = new Registry();

/**
 * Create a new registry
 */
export function createRegistry(): Registry {
  return new Registry();
}
