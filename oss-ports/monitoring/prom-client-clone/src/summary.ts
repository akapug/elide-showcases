/**
 * Prometheus Summary Implementation
 *
 * Summaries calculate quantiles over sliding time windows
 */

import type {
  SummaryConfiguration,
  SummaryMetrics,
  LabelValues,
  Metric,
  MetricType,
  TimerFunction,
} from './types';
import {
  validateMetricConfiguration,
  validateLabels,
  validatePercentiles,
  formatLabels,
  DEFAULT_SUMMARY_PERCENTILES,
  DEFAULT_SUMMARY_MAX_AGE_SECONDS,
  DEFAULT_SUMMARY_AGE_BUCKETS,
} from './validation';
import { register as defaultRegistry } from './registry';

interface TimeWindowObservation {
  value: number;
  timestamp: number;
}

/**
 * Summary child for labeled metrics
 */
export class SummaryChild {
  private count: number = 0;
  private sum: number = 0;
  private observations: TimeWindowObservation[][] = [];
  private currentBucket: number = 0;

  constructor(
    private readonly labels: LabelValues,
    private readonly percentiles: number[],
    private readonly maxAgeSeconds: number,
    private readonly ageBuckets: number
  ) {
    // Initialize age buckets
    for (let i = 0; i < ageBuckets; i++) {
      this.observations.push([]);
    }
  }

  /**
   * Observe a value
   */
  observe(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Summary value must be a number');
    }

    this.count++;
    this.sum += value;

    // Add to current bucket
    this.observations[this.currentBucket].push({
      value,
      timestamp: Date.now(),
    });

    // Rotate buckets if needed
    this.rotateBuckets();
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
   * Calculate quantiles
   */
  private calculateQuantiles(): Record<string, number> {
    const quantiles: Record<string, number> = {};

    // Collect all valid observations
    const now = Date.now();
    const maxAge = this.maxAgeSeconds * 1000;
    const validObservations: number[] = [];

    for (const bucket of this.observations) {
      for (const obs of bucket) {
        if (now - obs.timestamp <= maxAge) {
          validObservations.push(obs.value);
        }
      }
    }

    if (validObservations.length === 0) {
      for (const percentile of this.percentiles) {
        quantiles[percentile.toString()] = 0;
      }
      return quantiles;
    }

    // Sort observations
    validObservations.sort((a, b) => a - b);

    // Calculate percentiles
    for (const percentile of this.percentiles) {
      const index = Math.ceil(validObservations.length * percentile) - 1;
      quantiles[percentile.toString()] =
        validObservations[Math.max(0, index)];
    }

    return quantiles;
  }

  /**
   * Rotate age buckets
   */
  private rotateBuckets(): void {
    const bucketDuration = (this.maxAgeSeconds * 1000) / this.ageBuckets;
    const now = Date.now();

    // Check if we need to rotate
    const currentBucket = this.observations[this.currentBucket];
    if (currentBucket.length > 0) {
      const oldestInBucket = currentBucket[0].timestamp;
      if (now - oldestInBucket >= bucketDuration) {
        this.currentBucket = (this.currentBucket + 1) % this.ageBuckets;
        this.observations[this.currentBucket] = [];
      }
    }
  }

  /**
   * Get summary metrics
   */
  get(): SummaryMetrics {
    return {
      count: this.count,
      sum: this.sum,
      quantiles: this.calculateQuantiles(),
    };
  }

  /**
   * Reset summary
   */
  reset(): void {
    this.count = 0;
    this.sum = 0;
    this.currentBucket = 0;

    for (let i = 0; i < this.ageBuckets; i++) {
      this.observations[i] = [];
    }
  }

  /**
   * Get labels
   */
  getLabels(): LabelValues {
    return { ...this.labels };
  }
}

/**
 * Summary metric type
 */
export class Summary<T extends string = string> implements Metric {
  public readonly name: string;
  public readonly help: string;
  public readonly type: MetricType = 'summary';
  private readonly labelNames: readonly T[];
  private readonly percentiles: number[];
  private readonly maxAgeSeconds: number;
  private readonly ageBuckets: number;
  private readonly children: Map<string, SummaryChild> = new Map();
  private count: number = 0;
  private sum: number = 0;
  private observations: TimeWindowObservation[][] = [];
  private currentBucket: number = 0;
  private readonly collectFn?: () => void | Promise<void>;

  constructor(config: SummaryConfiguration<T>) {
    validateMetricConfiguration(config);

    this.name = config.name;
    this.help = config.help;
    this.labelNames = (config.labelNames || []) as readonly T[];
    this.collectFn = config.collect;

    // Setup percentiles
    this.percentiles = config.percentiles || DEFAULT_SUMMARY_PERCENTILES;
    validatePercentiles(this.percentiles);

    // Setup time windows
    this.maxAgeSeconds =
      config.maxAgeSeconds || DEFAULT_SUMMARY_MAX_AGE_SECONDS;
    this.ageBuckets = config.ageBuckets || DEFAULT_SUMMARY_AGE_BUCKETS;

    // Initialize age buckets
    for (let i = 0; i < this.ageBuckets; i++) {
      this.observations.push([]);
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
          `This summary requires labels: ${this.labelNames.join(', ')}`
        );
      }

      if (isNaN(labelsOrValue)) {
        throw new Error('Summary value must be a number');
      }

      this.count++;
      this.sum += labelsOrValue;

      // Add to current bucket
      this.observations[this.currentBucket].push({
        value: labelsOrValue,
        timestamp: Date.now(),
      });

      // Rotate buckets if needed
      this.rotateBuckets();

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
   * Rotate age buckets
   */
  private rotateBuckets(): void {
    const bucketDuration = (this.maxAgeSeconds * 1000) / this.ageBuckets;
    const now = Date.now();

    // Check if we need to rotate
    const currentBucket = this.observations[this.currentBucket];
    if (currentBucket.length > 0) {
      const oldestInBucket = currentBucket[0].timestamp;
      if (now - oldestInBucket >= bucketDuration) {
        this.currentBucket = (this.currentBucket + 1) % this.ageBuckets;
        this.observations[this.currentBucket] = [];
      }
    }
  }

  /**
   * Calculate quantiles
   */
  private calculateQuantiles(): Record<string, number> {
    const quantiles: Record<string, number> = {};

    // Collect all valid observations
    const now = Date.now();
    const maxAge = this.maxAgeSeconds * 1000;
    const validObservations: number[] = [];

    for (const bucket of this.observations) {
      for (const obs of bucket) {
        if (now - obs.timestamp <= maxAge) {
          validObservations.push(obs.value);
        }
      }
    }

    if (validObservations.length === 0) {
      for (const percentile of this.percentiles) {
        quantiles[percentile.toString()] = 0;
      }
      return quantiles;
    }

    // Sort observations
    validObservations.sort((a, b) => a - b);

    // Calculate percentiles
    for (const percentile of this.percentiles) {
      const index = Math.ceil(validObservations.length * percentile) - 1;
      quantiles[percentile.toString()] =
        validObservations[Math.max(0, index)];
    }

    return quantiles;
  }

  /**
   * Get or create labeled child
   */
  labels(labels: LabelValues<T>): SummaryChild {
    validateLabels(labels, this.labelNames);

    const key = this.hashLabels(labels);
    let child = this.children.get(key);

    if (!child) {
      child = new SummaryChild(
        labels,
        this.percentiles,
        this.maxAgeSeconds,
        this.ageBuckets
      );
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
   * Get summary metrics
   */
  get(): SummaryMetrics | SummaryMetrics[] {
    if (this.labelNames.length === 0) {
      return {
        count: this.count,
        sum: this.sum,
        quantiles: this.calculateQuantiles(),
      };
    }

    return Array.from(this.children.values()).map((child) => child.get());
  }

  /**
   * Reset summary
   */
  reset(): void {
    this.count = 0;
    this.sum = 0;
    this.currentBucket = 0;

    for (let i = 0; i < this.ageBuckets; i++) {
      this.observations[i] = [];
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
    lines.push(`# TYPE ${this.name} summary`);

    if (this.labelNames.length === 0) {
      // No labels - serialize unlabeled summary
      const quantiles = this.calculateQuantiles();

      for (const [percentile, value] of Object.entries(quantiles)) {
        lines.push(`${this.name}{quantile="${percentile}"} ${value}`);
      }

      lines.push(`${this.name}_sum ${this.sum}`);
      lines.push(`${this.name}_count ${this.count}`);
    } else {
      // With labels - serialize each child
      for (const child of this.children.values()) {
        const metrics = child.get();
        const baseLabels = child.getLabels();

        // Quantiles
        for (const [percentile, value] of Object.entries(metrics.quantiles)) {
          const labels = formatLabels({ ...baseLabels, quantile: percentile });
          lines.push(`${this.name}${labels} ${value}`);
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
  getChildren(): SummaryChild[] {
    return Array.from(this.children.values());
  }

  /**
   * Get number of child instances
   */
  get childCount(): number {
    return this.children.size;
  }
}

/**
 * Create a summary metric
 */
export function createSummary<T extends string = string>(
  config: SummaryConfiguration<T>
): Summary<T> {
  return new Summary(config);
}
