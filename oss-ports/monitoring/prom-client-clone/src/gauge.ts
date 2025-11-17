/**
 * Prometheus Gauge Implementation
 *
 * Gauges are metrics that can increase or decrease
 */

import type {
  GaugeConfiguration,
  LabelValues,
  Metric,
  MetricType,
  MetricValue,
  TimerFunction,
} from './types';
import { validateMetricConfiguration, validateLabels, formatLabels } from './validation';
import { register as defaultRegistry } from './registry';

/**
 * Gauge child for labeled metrics
 */
export class GaugeChild {
  private value: number = 0;

  constructor(private readonly labels: LabelValues) {}

  /**
   * Set gauge to specific value
   */
  set(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Gauge value must be a number');
    }
    this.value = value;
  }

  /**
   * Increment gauge by value (default 1)
   */
  inc(value: number = 1): void {
    this.value += value;
  }

  /**
   * Decrement gauge by value (default 1)
   */
  dec(value: number = 1): void {
    this.value -= value;
  }

  /**
   * Set to current timestamp in seconds
   */
  setToCurrentTime(): void {
    this.value = Date.now() / 1000;
  }

  /**
   * Get current value
   */
  get(): number {
    return this.value;
  }

  /**
   * Reset gauge to zero
   */
  reset(): void {
    this.value = 0;
  }

  /**
   * Get labels
   */
  getLabels(): LabelValues {
    return { ...this.labels };
  }
}

/**
 * Gauge metric type
 */
export class Gauge<T extends string = string> implements Metric {
  public readonly name: string;
  public readonly help: string;
  public readonly type: MetricType = 'gauge';
  private readonly labelNames: readonly T[];
  private readonly children: Map<string, GaugeChild> = new Map();
  private value: number = 0;
  private readonly collectFn?: () => void | Promise<void>;

  constructor(config: GaugeConfiguration<T>) {
    validateMetricConfiguration(config);

    this.name = config.name;
    this.help = config.help;
    this.labelNames = (config.labelNames || []) as readonly T[];
    this.collectFn = config.collect;

    // Register with provided registries or default registry
    const registries = config.registers || [defaultRegistry];
    for (const registry of registries) {
      registry.registerMetric(this);
    }
  }

  /**
   * Set gauge to specific value
   */
  set(value: number): void;
  set(labels: LabelValues<T>, value: number): void;
  set(labelsOrValue: LabelValues<T> | number, value?: number): void {
    // No labels
    if (typeof labelsOrValue === 'number') {
      if (this.labelNames.length > 0) {
        throw new Error(
          `This gauge requires labels: ${this.labelNames.join(', ')}`
        );
      }

      if (isNaN(labelsOrValue)) {
        throw new Error('Gauge value must be a number');
      }

      this.value = labelsOrValue;
      return;
    }

    // With labels
    if (value === undefined) {
      throw new Error('Value is required when using labels');
    }

    validateLabels(labelsOrValue, this.labelNames);
    const child = this.labels(labelsOrValue);
    child.set(value);
  }

  /**
   * Increment gauge by value (default 1)
   */
  inc(value?: number): void;
  inc(labels: LabelValues<T>, value?: number): void;
  inc(labelsOrValue?: LabelValues<T> | number, value: number = 1): void {
    // No labels
    if (typeof labelsOrValue === 'number' || labelsOrValue === undefined) {
      const incrementValue = typeof labelsOrValue === 'number' ? labelsOrValue : 1;

      if (this.labelNames.length > 0) {
        throw new Error(
          `This gauge requires labels: ${this.labelNames.join(', ')}`
        );
      }

      this.value += incrementValue;
      return;
    }

    // With labels
    validateLabels(labelsOrValue, this.labelNames);
    const child = this.labels(labelsOrValue);
    child.inc(value);
  }

  /**
   * Decrement gauge by value (default 1)
   */
  dec(value?: number): void;
  dec(labels: LabelValues<T>, value?: number): void;
  dec(labelsOrValue?: LabelValues<T> | number, value: number = 1): void {
    // No labels
    if (typeof labelsOrValue === 'number' || labelsOrValue === undefined) {
      const decrementValue = typeof labelsOrValue === 'number' ? labelsOrValue : 1;

      if (this.labelNames.length > 0) {
        throw new Error(
          `This gauge requires labels: ${this.labelNames.join(', ')}`
        );
      }

      this.value -= decrementValue;
      return;
    }

    // With labels
    validateLabels(labelsOrValue, this.labelNames);
    const child = this.labels(labelsOrValue);
    child.dec(value);
  }

  /**
   * Set to current timestamp in seconds
   */
  setToCurrentTime(): void;
  setToCurrentTime(labels: LabelValues<T>): void;
  setToCurrentTime(labels?: LabelValues<T>): void {
    // No labels
    if (!labels) {
      if (this.labelNames.length > 0) {
        throw new Error(
          `This gauge requires labels: ${this.labelNames.join(', ')}`
        );
      }

      this.value = Date.now() / 1000;
      return;
    }

    // With labels
    validateLabels(labels, this.labelNames);
    const child = this.labels(labels);
    child.setToCurrentTime();
  }

  /**
   * Start a timer that sets gauge to duration when stopped
   */
  startTimer(): TimerFunction;
  startTimer(labels: LabelValues<T>): TimerFunction;
  startTimer(labels?: LabelValues<T>): TimerFunction {
    const startTime = Date.now();

    return (endLabels?: LabelValues<T>): number => {
      const duration = (Date.now() - startTime) / 1000;
      const finalLabels = endLabels || labels;

      if (finalLabels) {
        this.set(finalLabels, duration);
      } else {
        this.set(duration);
      }

      return duration;
    };
  }

  /**
   * Get or create labeled child
   */
  labels(labels: LabelValues<T>): GaugeChild {
    validateLabels(labels, this.labelNames);

    const key = this.hashLabels(labels);
    let child = this.children.get(key);

    if (!child) {
      child = new GaugeChild(labels);
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
   * Get current value (or values for labeled metrics)
   */
  get(): number | MetricValue[] {
    if (this.labelNames.length === 0) {
      return this.value;
    }

    const values: MetricValue[] = [];
    for (const child of this.children.values()) {
      values.push({
        value: child.get(),
        labels: child.getLabels(),
      });
    }

    return values;
  }

  /**
   * Reset gauge to zero
   */
  reset(): void {
    this.value = 0;
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
    lines.push(`# TYPE ${this.name} gauge`);

    // Add metric values
    if (this.labelNames.length === 0) {
      lines.push(`${this.name} ${this.value}`);
    } else {
      for (const child of this.children.values()) {
        const labels = formatLabels(child.getLabels());
        lines.push(`${this.name}${labels} ${child.get()}`);
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
  getChildren(): GaugeChild[] {
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
 * Create a gauge metric
 */
export function createGauge<T extends string = string>(
  config: GaugeConfiguration<T>
): Gauge<T> {
  return new Gauge(config);
}
