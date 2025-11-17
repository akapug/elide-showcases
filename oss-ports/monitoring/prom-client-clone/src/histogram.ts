/**
 * Prometheus Histogram Implementation
 *
 * Histograms sample observations and count them in configurable buckets
 */

import type {
  HistogramConfiguration,
  HistogramMetrics,
  LabelValues,
  Metric,
  MetricType,
  TimerFunction,
} from './types';
import {
  validateMetricConfiguration,
  validateLabels,
  validateBuckets,
  formatLabels,
  DEFAULT_HISTOGRAM_BUCKETS,
} from './validation';
import { register as defaultRegistry } from './registry';

/**
 * Histogram child for labeled metrics
 */
export class HistogramChild {
  private count: number = 0;
  private sum: number = 0;
  private buckets: Map<number, number>;

  constructor(
    private readonly labels: LabelValues,
    bucketBounds: number[]
  ) {
    this.buckets = new Map();
    for (const bound of bucketBounds) {
      this.buckets.set(bound, 0);
    }
  }

  /**
   * Observe a value
   */
  observe(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Histogram value must be a number');
    }

    this.count++;
    this.sum += value;

    // Increment bucket counts
    for (const [bound, count] of this.buckets.entries()) {
      if (value <= bound) {
        this.buckets.set(bound, count + 1);
      }
    }
  }

  /**
   * Start a timer
   */
  startTimer(): () => number {
    const startTime = Date.now();

    return (): number => {
      const duration = (Date.now() - startTime) / 1000;
      this.observe(duration);
      return duration;
    };
  }

  /**
   * Get histogram metrics
   */
  get(): HistogramMetrics {
    const buckets: Record<string, number> = {};

    for (const [bound, count] of this.buckets.entries()) {
      const key = bound === Infinity ? '+Inf' : bound.toString();
      buckets[key] = count;
    }

    return {
      count: this.count,
      sum: this.sum,
      buckets,
    };
  }

  /**
   * Reset histogram
   */
  reset(): void {
    this.count = 0;
    this.sum = 0;

    for (const bound of this.buckets.keys()) {
      this.buckets.set(bound, 0);
    }
  }

  /**
   * Get labels
   */
  getLabels(): LabelValues {
    return { ...this.labels };
  }

  /**
   * Get bucket bounds
   */
  getBucketBounds(): number[] {
    return Array.from(this.buckets.keys());
  }
}

/**
 * Histogram metric type
 */
export class Histogram<T extends string = string> implements Metric {
  public readonly name: string;
  public readonly help: string;
  public readonly type: MetricType = 'histogram';
  private readonly labelNames: readonly T[];
  private readonly bucketBounds: number[];
  private readonly children: Map<string, HistogramChild> = new Map();
  private count: number = 0;
  private sum: number = 0;
  private buckets: Map<number, number>;
  private readonly collectFn?: () => void | Promise<void>;

  constructor(config: HistogramConfiguration<T>) {
    validateMetricConfiguration(config);

    this.name = config.name;
    this.help = config.help;
    this.labelNames = (config.labelNames || []) as readonly T[];
    this.collectFn = config.collect;

    // Setup buckets
    let buckets = config.buckets || DEFAULT_HISTOGRAM_BUCKETS;

    // Ensure +Inf bucket
    if (buckets[buckets.length - 1] !== Infinity) {
      buckets = [...buckets, Infinity];
    }

    validateBuckets(buckets);
    this.bucketBounds = buckets;

    // Initialize buckets
    this.buckets = new Map();
    for (const bound of this.bucketBounds) {
      this.buckets.set(bound, 0);
    }

    // Register with provided registries or default registry
    const registries = config.registers || [defaultRegistry];
    for (const registry of registries) {
      registry.registerMetric(this);
    }
  }

  /**
   * Observe a value
   */
  observe(value: number): void;
  observe(labels: LabelValues<T>, value: number): void;
  observe(labelsOrValue: LabelValues<T> | number, value?: number): void {
    // No labels
    if (typeof labelsOrValue === 'number') {
      if (this.labelNames.length > 0) {
        throw new Error(
          `This histogram requires labels: ${this.labelNames.join(', ')}`
        );
      }

      if (isNaN(labelsOrValue)) {
        throw new Error('Histogram value must be a number');
      }

      this.count++;
      this.sum += labelsOrValue;

      // Increment bucket counts
      for (const [bound, count] of this.buckets.entries()) {
        if (labelsOrValue <= bound) {
          this.buckets.set(bound, count + 1);
        }
      }

      return;
    }

    // With labels
    if (value === undefined) {
      throw new Error('Value is required when using labels');
    }

    validateLabels(labelsOrValue, this.labelNames);
    const child = this.labels(labelsOrValue);
    child.observe(value);
  }

  /**
   * Start a timer
   */
  startTimer(): TimerFunction;
  startTimer(labels: LabelValues<T>): TimerFunction;
  startTimer(labels?: LabelValues<T>): TimerFunction {
    const startTime = Date.now();

    return (endLabels?: LabelValues<T>): number => {
      const duration = (Date.now() - startTime) / 1000;
      const finalLabels = endLabels || labels;

      if (finalLabels) {
        this.observe(finalLabels, duration);
      } else {
        this.observe(duration);
      }

      return duration;
    };
  }

  /**
   * Get or create labeled child
   */
  labels(labels: LabelValues<T>): HistogramChild {
    validateLabels(labels, this.labelNames);

    const key = this.hashLabels(labels);
    let child = this.children.get(key);

    if (!child) {
      child = new HistogramChild(labels, this.bucketBounds);
      this.children.set(key, child);
    }

    return child;
  }

  /**
   * Remove a labeled child
   */
  remove(labels: LabelValues<T>): void {
    validateLabels(labels, this.labelNames);
    const key = this.hashLabels(labels);
    this.children.delete(key);
  }

  /**
   * Get histogram metrics
   */
  get(): HistogramMetrics | HistogramMetrics[] {
    if (this.labelNames.length === 0) {
      const buckets: Record<string, number> = {};

      for (const [bound, count] of this.buckets.entries()) {
        const key = bound === Infinity ? '+Inf' : bound.toString();
        buckets[key] = count;
      }

      return {
        count: this.count,
        sum: this.sum,
        buckets,
      };
    }

    return Array.from(this.children.values()).map((child) => child.get());
  }

  /**
   * Reset histogram
   */
  reset(): void {
    this.count = 0;
    this.sum = 0;

    for (const bound of this.buckets.keys()) {
      this.buckets.set(bound, 0);
    }

    this.children.clear();
  }

  /**
   * Collect callback
   */
  async collect(): Promise<void> {
    if (this.collectFn) {
      await this.collectFn();
    }
  }

  /**
   * Serialize to Prometheus text format
   */
  serialize(): string {
    const lines: string[] = [];

    // Add HELP line
    lines.push(`# HELP ${this.name} ${this.help}`);

    // Add TYPE line
    lines.push(`# TYPE ${this.name} histogram`);

    if (this.labelNames.length === 0) {
      // No labels - serialize unlabeled histogram
      for (const [bound, count] of this.buckets.entries()) {
        const le = bound === Infinity ? '+Inf' : bound.toString();
        lines.push(`${this.name}_bucket{le="${le}"} ${count}`);
      }

      lines.push(`${this.name}_sum ${this.sum}`);
      lines.push(`${this.name}_count ${this.count}`);
    } else {
      // With labels - serialize each child
      for (const child of this.children.values()) {
        const metrics = child.get();
        const baseLabels = child.getLabels();

        // Buckets
        for (const [bound, count] of Object.entries(metrics.buckets)) {
          const le = bound === '+Inf' ? '+Inf' : bound;
          const labels = formatLabels({ ...baseLabels, le });
          lines.push(`${this.name}_bucket${labels} ${count}`);
        }

        // Sum
        const sumLabels = formatLabels(baseLabels);
        lines.push(`${this.name}_sum${sumLabels} ${metrics.sum}`);

        // Count
        lines.push(`${this.name}_count${sumLabels} ${metrics.count}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Hash labels to create unique key
   */
  private hashLabels(labels: LabelValues<T>): string {
    const parts: string[] = [];
    const sortedKeys = Object.keys(labels).sort();

    for (const key of sortedKeys) {
      parts.push(`${key}:${labels[key]}`);
    }

    return parts.join(',');
  }

  /**
   * Get all child instances
   */
  getChildren(): HistogramChild[] {
    return Array.from(this.children.values());
  }

  /**
   * Get number of child instances
   */
  get childCount(): number {
    return this.children.size;
  }

  /**
   * Get bucket bounds
   */
  getBucketBounds(): number[] {
    return [...this.bucketBounds];
  }
}

/**
 * Create a histogram metric
 */
export function createHistogram<T extends string = string>(
  config: HistogramConfiguration<T>
): Histogram<T> {
  return new Histogram(config);
}

/**
 * Linear buckets helper
 */
export function linearBuckets(start: number, width: number, count: number): number[] {
  const buckets: number[] = [];

  for (let i = 0; i < count; i++) {
    buckets.push(start + i * width);
  }

  buckets.push(Infinity);
  return buckets;
}

/**
 * Exponential buckets helper
 */
export function exponentialBuckets(
  start: number,
  factor: number,
  count: number
): number[] {
  const buckets: number[] = [];
  let current = start;

  for (let i = 0; i < count; i++) {
    buckets.push(current);
    current *= factor;
  }

  buckets.push(Infinity);
  return buckets;
}
