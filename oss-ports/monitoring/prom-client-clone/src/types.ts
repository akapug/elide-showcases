/**
 * Core types and interfaces for Prometheus client
 */

export type LabelValues<T extends string = string> = Partial<Record<T, string | number>>;

export interface MetricConfiguration<T extends string = string> {
  name: string;
  help: string;
  labelNames?: readonly T[];
  registers?: Registry[];
  aggregator?: 'sum' | 'first' | 'min' | 'max' | 'average';
  enableExemplars?: boolean;
  collect?(): void | Promise<void>;
}

export interface CounterConfiguration<T extends string = string>
  extends MetricConfiguration<T> {}

export interface GaugeConfiguration<T extends string = string>
  extends MetricConfiguration<T> {}

export interface HistogramConfiguration<T extends string = string>
  extends MetricConfiguration<T> {
  buckets?: number[];
}

export interface SummaryConfiguration<T extends string = string>
  extends MetricConfiguration<T> {
  percentiles?: number[];
  maxAgeSeconds?: number;
  ageBuckets?: number;
}

export interface Metric {
  name: string;
  help: string;
  type: MetricType;
  get(): MetricValue;
  reset(): void;
  collect(): void | Promise<void>;
  serialize(): string;
}

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricValue {
  value: number;
  labels?: LabelValues;
}

export interface MetricJSON {
  name: string;
  help: string;
  type: MetricType;
  values: MetricValueJSON[];
  aggregator?: string;
}

export interface MetricValueJSON {
  value: number;
  labels?: LabelValues;
  timestamp?: number;
  exemplar?: Exemplar;
}

export interface Exemplar {
  value: number;
  timestamp: number;
  labels: LabelValues;
}

export interface HistogramMetrics {
  count: number;
  sum: number;
  buckets: Record<string, number>;
}

export interface SummaryMetrics {
  count: number;
  sum: number;
  quantiles: Record<string, number>;
}

export interface Registry {
  metrics(): Promise<string>;
  getMetricsAsJSON(): Promise<MetricJSON[]>;
  getSingleMetric(name: string): Metric | undefined;
  registerMetric(metric: Metric): void;
  removeSingleMetric(name: string): void;
  clear(): void;
  resetMetrics(): void;
  setDefaultLabels(labels: LabelValues): void;
  get contentType(): string;
  setContentType(type: string): void;
}

export interface TimerFunction {
  (labels?: LabelValues): number;
}

export interface PushgatewayConfiguration {
  timeout?: number;
  headers?: Record<string, string>;
  auth?: {
    username: string;
    password: string;
  };
}

export interface PushgatewayOptions {
  jobName: string;
  groupings?: LabelValues;
  registry?: Registry;
}

export interface DefaultMetricsConfiguration {
  register?: Registry;
  prefix?: string;
  gcDurationBuckets?: number[];
  eventLoopMonitoringPrecision?: number;
  timeout?: number;
  labels?: LabelValues;
}
