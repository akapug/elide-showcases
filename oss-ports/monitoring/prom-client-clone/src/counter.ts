/**
 * Prometheus Counter Implementation
 *
 * Counters are cumulative metrics that only increase (or reset to zero on restart)
 */

import type {
  CounterConfiguration,
  LabelValues,
  Metric,
  MetricType,
  MetricValue,
} from './types';
import { validateMetricConfiguration, validateLabels, formatLabels } from './validation';
import { register as defaultRegistry } from './registry';

/**
 * Counter child for labeled metrics
 */
export class CounterChild {
  private value: number = 0;

  constructor(private readonly labels: LabelValues) {}

  /**
   * Increment counter by value (default 1)
   */
  inc(value: number = 1): void {
    if (value < 0) {
      throw new Error('Counter can only be incremented by non-negative values');
    }
    this.value += value;
  }

  /**
   * Get current value
   */
  get(): number {
    return this.value;
  }

  /**
   * Reset counter to zero
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
 * Counter metric type
 */
export class Counter<T extends string = string> implements Metric {
  public readonly name: string;
  public readonly help: string;
  public readonly type: MetricType = 'counter';
  private readonly labelNames: readonly T[];
  private readonly children: Map<string, CounterChild> = new Map();
  private value: number = 0;
  private readonly collectFn?: () => void | Promise<void>;

  constructor(config: CounterConfiguration<T>) {
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
   * Increment counter by value (default 1)
   */
  inc(value?: number): void;
  inc(labels: LabelValues<T>, value?: number): void;
  inc(labelsOrValue?: LabelValues<T> | number, value: number = 1): void {
    // No labels
    if (typeof labelsOrValue === 'number' || labelsOrValue === undefined) {
      const incrementValue = typeof labelsOrValue === 'number' ? labelsOrValue : 1;

      if (incrementValue < 0) {
        throw new Error('Counter can only be incremented by non-negative values');
      }

      if (this.labelNames.length > 0) {
        throw new Error(
          `This counter requires labels: ${this.labelNames.join(', ')}`
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
   * Get or create labeled child
   */
  labels(labels: LabelValues<T>): CounterChild {
    validateLabels(labels, this.labelNames);

    const key = this.hashLabels(labels);
    let child = this.children.get(key);

    if (!child) {
      child = new CounterChild(labels);
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
   * Reset counter to zero
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
    lines.push(`# TYPE ${this.name} counter`);

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
  getChildren(): CounterChild[] {
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
 * Create a counter metric
 */
export function createCounter<T extends string = string>(
  config: CounterConfiguration<T>
): Counter<T> {
  return new Counter(config);
}
