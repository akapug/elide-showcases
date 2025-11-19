/**
 * Core types for OpenTelemetry
 */

// Trace types
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: TraceState;
  isRemote?: boolean;
}

export interface TraceState {
  get(key: string): string | undefined;
  set(key: string, value: string): TraceState;
  unset(key: string): TraceState;
  serialize(): string;
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface SpanStatus {
  code: SpanStatusCode;
  message?: string;
}

export interface SpanAttributes {
  [key: string]: AttributeValue;
}

export type AttributeValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | null
  | undefined;

export interface Link {
  context: SpanContext;
  attributes?: SpanAttributes;
}

export interface Event {
  name: string;
  time?: number;
  attributes?: SpanAttributes;
}

export interface Exception {
  message: string;
  type?: string;
  stacktrace?: string;
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: SpanAttributes;
  links?: Link[];
  startTime?: number;
}

// Metric types
export interface MetricDescriptor {
  name: string;
  description?: string;
  unit?: string;
  valueType?: ValueType;
}

export enum ValueType {
  INT = 0,
  DOUBLE = 1,
}

export interface MetricAttributes {
  [key: string]: string | number | boolean;
}

export interface ObservableResult {
  observe(value: number, attributes?: MetricAttributes): void;
}

export type ObservableCallback = (observableResult: ObservableResult) => void | Promise<void>;

// Logging types
export enum SeverityNumber {
  UNSPECIFIED = 0,
  TRACE = 1,
  TRACE2 = 2,
  TRACE3 = 3,
  TRACE4 = 4,
  DEBUG = 5,
  DEBUG2 = 6,
  DEBUG3 = 7,
  DEBUG4 = 8,
  INFO = 9,
  INFO2 = 10,
  INFO3 = 11,
  INFO4 = 12,
  WARN = 13,
  WARN2 = 14,
  WARN3 = 15,
  WARN4 = 16,
  ERROR = 17,
  ERROR2 = 18,
  ERROR3 = 19,
  ERROR4 = 20,
  FATAL = 21,
  FATAL2 = 22,
  FATAL3 = 23,
  FATAL4 = 24,
}

export interface LogRecord {
  timestamp?: number;
  observedTimestamp?: number;
  severityNumber?: SeverityNumber;
  severityText?: string;
  body?: string | any;
  attributes?: Record<string, AttributeValue>;
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
}

// Context types
export interface Context {
  getValue(key: symbol): unknown;
  setValue(key: symbol, value: unknown): Context;
  deleteValue(key: symbol): Context;
}

export interface ContextManager {
  active(): Context;
  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    context: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F>;
  bind<T>(context: Context, target: T): T;
  enable(): this;
  disable(): this;
}

// Propagation types
export interface TextMapGetter<Carrier> {
  get(carrier: Carrier, key: string): undefined | string | string[];
  keys(carrier: Carrier): string[];
}

export interface TextMapSetter<Carrier> {
  set(carrier: Carrier, key: string, value: string): void;
}

export interface TextMapPropagator<Carrier = any> {
  inject(context: Context, carrier: Carrier, setter: TextMapSetter<Carrier>): void;
  extract(context: Context, carrier: Carrier, getter: TextMapGetter<Carrier>): Context;
  fields(): string[];
}

// Baggage types
export interface BaggageEntry {
  value: string;
  metadata?: string;
}

export interface Baggage {
  getEntry(key: string): BaggageEntry | undefined;
  getAllEntries(): [string, BaggageEntry][];
  setEntry(key: string, entry: BaggageEntry): Baggage;
  removeEntry(key: string): Baggage;
}

// Resource types
export interface ResourceAttributes {
  [key: string]: AttributeValue;
}

export interface Resource {
  attributes: ResourceAttributes;
  merge(other: Resource | null): Resource;
}

// Exporter types
export interface SpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void;
  shutdown(): Promise<void>;
}

export interface ReadableSpan {
  readonly name: string;
  readonly kind: SpanKind;
  readonly spanContext: () => SpanContext;
  readonly parentSpanId?: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly status: SpanStatus;
  readonly attributes: SpanAttributes;
  readonly links: Link[];
  readonly events: TimedEvent[];
  readonly duration: number;
  readonly ended: boolean;
  readonly resource: Resource;
  readonly instrumentationLibrary: InstrumentationLibrary;
}

export interface TimedEvent extends Event {
  time: number;
}

export interface InstrumentationLibrary {
  name: string;
  version?: string;
  schemaUrl?: string;
}

export interface ExportResult {
  code: ExportResultCode;
  error?: Error;
}

export enum ExportResultCode {
  SUCCESS = 0,
  FAILED = 1,
}

export interface MetricExporter {
  export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

export interface ResourceMetrics {
  resource: Resource;
  scopeMetrics: ScopeMetrics[];
}

export interface ScopeMetrics {
  scope: InstrumentationLibrary;
  metrics: Metric[];
}

export interface Metric {
  descriptor: MetricDescriptor;
  dataPoints: DataPoint[];
  aggregationTemporality?: AggregationTemporality;
}

export interface DataPoint {
  attributes: MetricAttributes;
  value: number;
  startTime: number;
  endTime: number;
}

export enum AggregationTemporality {
  UNSPECIFIED = 0,
  DELTA = 1,
  CUMULATIVE = 2,
}

export interface LogExporter {
  export(logs: ReadableLogRecord[], resultCallback: (result: ExportResult) => void): void;
  shutdown(): Promise<void>;
}

export interface ReadableLogRecord extends LogRecord {
  readonly resource: Resource;
  readonly instrumentationScope: InstrumentationLibrary;
}

// Sampling types
export interface SamplingResult {
  decision: SamplingDecision;
  attributes?: SpanAttributes;
  traceState?: TraceState;
}

export enum SamplingDecision {
  NOT_RECORD = 0,
  RECORD = 1,
  RECORD_AND_SAMPLED = 2,
}

export interface Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
    links: Link[]
  ): SamplingResult;
  toString(): string;
}

// Instrumentation types
export interface InstrumentationConfig {
  enabled?: boolean;
  [key: string]: unknown;
}

export interface Instrumentation {
  instrumentationName: string;
  instrumentationVersion?: string;
  enable(): void;
  disable(): void;
  setTracerProvider(tracerProvider: TracerProvider): void;
  setMeterProvider(meterProvider: MeterProvider): void;
}

// Provider types
export interface TracerProvider {
  getTracer(name: string, version?: string, options?: TracerOptions): Tracer;
}

export interface MeterProvider {
  getMeter(name: string, version?: string, options?: MeterOptions): Meter;
}

export interface LoggerProvider {
  getLogger(name: string, version?: string, options?: LoggerOptions): Logger;
}

export interface TracerOptions {
  schemaUrl?: string;
}

export interface MeterOptions {
  schemaUrl?: string;
}

export interface LoggerOptions {
  schemaUrl?: string;
}

// Tracer, Meter, Logger interfaces
export interface Tracer {
  startSpan(name: string, options?: SpanOptions, context?: Context): Span;
  startActiveSpan<F extends (span: Span) => ReturnType<F>>(
    name: string,
    fn: F
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => ReturnType<F>>(
    name: string,
    options: SpanOptions,
    fn: F
  ): ReturnType<F>;
  startActiveSpan<F extends (span: Span) => ReturnType<F>>(
    name: string,
    options: SpanOptions,
    context: Context,
    fn: F
  ): ReturnType<F>;
}

export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: AttributeValue): this;
  setAttributes(attributes: SpanAttributes): this;
  addEvent(name: string, attributesOrStartTime?: SpanAttributes | number, startTime?: number): this;
  setStatus(status: SpanStatus): this;
  updateName(name: string): this;
  end(endTime?: number): void;
  isRecording(): boolean;
  recordException(exception: Exception | Error, time?: number): void;
}

export interface Meter {
  createCounter(name: string, options?: MetricOptions): Counter;
  createUpDownCounter(name: string, options?: MetricOptions): UpDownCounter;
  createHistogram(name: string, options?: MetricOptions): Histogram;
  createObservableGauge(name: string, options?: MetricOptions): ObservableGauge;
  createObservableCounter(name: string, options?: MetricOptions): ObservableCounter;
  createObservableUpDownCounter(name: string, options?: MetricOptions): ObservableUpDownCounter;
}

export interface MetricOptions {
  description?: string;
  unit?: string;
  valueType?: ValueType;
}

export interface Counter {
  add(value: number, attributes?: MetricAttributes): void;
  bind(attributes: MetricAttributes): BoundCounter;
}

export interface BoundCounter {
  add(value: number): void;
  unbind(): void;
}

export interface UpDownCounter {
  add(value: number, attributes?: MetricAttributes): void;
  bind(attributes: MetricAttributes): BoundUpDownCounter;
}

export interface BoundUpDownCounter {
  add(value: number): void;
  unbind(): void;
}

export interface Histogram {
  record(value: number, attributes?: MetricAttributes): void;
  bind(attributes: MetricAttributes): BoundHistogram;
}

export interface BoundHistogram {
  record(value: number): void;
  unbind(): void;
}

export interface ObservableGauge {
  addCallback(callback: ObservableCallback): void;
  removeCallback(callback: ObservableCallback): void;
}

export interface ObservableCounter {
  addCallback(callback: ObservableCallback): void;
  removeCallback(callback: ObservableCallback): void;
}

export interface ObservableUpDownCounter {
  addCallback(callback: ObservableCallback): void;
  removeCallback(callback: ObservableCallback): void;
}

export interface Logger {
  emit(logRecord: LogRecord): void;
}
