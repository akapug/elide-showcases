/**
 * OpenTelemetry Tracing Implementation
 */

import type {
  Tracer,
  TracerProvider,
  Span,
  SpanContext,
  SpanOptions,
  SpanKind,
  SpanStatus,
  SpanAttributes,
  AttributeValue,
  Link,
  Context,
  ReadableSpan,
  Resource,
  InstrumentationLibrary,
  TimedEvent,
  Exception,
} from './types';
import { SpanStatusCode } from './types';

// Trace state implementation
class TraceStateImpl {
  private state: Map<string, string> = new Map();

  get(key: string): string | undefined {
    return this.state.get(key);
  }

  set(key: string, value: string): TraceStateImpl {
    const newState = new TraceStateImpl();
    newState.state = new Map(this.state);
    newState.state.set(key, value);
    return newState;
  }

  unset(key: string): TraceStateImpl {
    const newState = new TraceStateImpl();
    newState.state = new Map(this.state);
    newState.state.delete(key);
    return newState;
  }

  serialize(): string {
    const entries = Array.from(this.state.entries());
    return entries.map(([k, v]) => `${k}=${v}`).join(',');
  }
}

// Span implementation
class SpanImpl implements Span, ReadableSpan {
  public readonly name: string;
  public readonly kind: SpanKind;
  public readonly startTime: number;
  public endTime: number = 0;
  public readonly parentSpanId?: string;
  public readonly attributes: SpanAttributes = {};
  public readonly links: Link[] = [];
  public readonly events: TimedEvent[] = [];
  public status: SpanStatus = { code: SpanStatusCode.UNSET };
  public ended: boolean = false;
  public readonly resource: Resource;
  public readonly instrumentationLibrary: InstrumentationLibrary;

  private _spanContext: SpanContext;

  constructor(
    name: string,
    options: SpanOptions = {},
    parentSpanId: string | undefined,
    spanContext: SpanContext,
    resource: Resource,
    instrumentationLibrary: InstrumentationLibrary
  ) {
    this.name = name;
    this.kind = options.kind || 0;
    this.startTime = options.startTime || Date.now();
    this.parentSpanId = parentSpanId;
    this._spanContext = spanContext;
    this.resource = resource;
    this.instrumentationLibrary = instrumentationLibrary;

    if (options.attributes) {
      Object.assign(this.attributes, options.attributes);
    }

    if (options.links) {
      this.links.push(...options.links);
    }
  }

  spanContext(): SpanContext {
    return this._spanContext;
  }

  setAttribute(key: string, value: AttributeValue): this {
    if (this.ended) return this;
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attributes: SpanAttributes): this {
    if (this.ended) return this;
    Object.assign(this.attributes, attributes);
    return this;
  }

  addEvent(
    name: string,
    attributesOrStartTime?: SpanAttributes | number,
    startTime?: number
  ): this {
    if (this.ended) return this;

    let attrs: SpanAttributes | undefined;
    let time: number;

    if (typeof attributesOrStartTime === 'number') {
      time = attributesOrStartTime;
    } else {
      attrs = attributesOrStartTime;
      time = startTime || Date.now();
    }

    this.events.push({
      name,
      time,
      attributes: attrs,
    });

    return this;
  }

  setStatus(status: SpanStatus): this {
    if (this.ended) return this;
    this.status = status;
    return this;
  }

  updateName(name: string): this {
    if (this.ended) return this;
    (this as any).name = name;
    return this;
  }

  end(endTime?: number): void {
    if (this.ended) return;
    this.endTime = endTime || Date.now();
    this.ended = true;
  }

  isRecording(): boolean {
    return !this.ended;
  }

  recordException(exception: Exception | Error, time?: number): void {
    if (this.ended) return;

    const attributes: SpanAttributes = {};

    if (exception instanceof Error) {
      attributes['exception.type'] = exception.name;
      attributes['exception.message'] = exception.message;
      if (exception.stack) {
        attributes['exception.stacktrace'] = exception.stack;
      }
    } else {
      attributes['exception.type'] = exception.type || 'Exception';
      attributes['exception.message'] = exception.message;
      if (exception.stacktrace) {
        attributes['exception.stacktrace'] = exception.stacktrace;
      }
    }

    this.addEvent('exception', attributes, time);
  }

  get duration(): number {
    return this.endTime - this.startTime;
  }
}

// Tracer implementation
class TracerImpl implements Tracer {
  constructor(
    private instrumentationLibrary: InstrumentationLibrary,
    private resource: Resource,
    private spanProcessor: SpanProcessor
  ) {}

  startSpan(name: string, options?: SpanOptions, context?: Context): Span {
    const spanContext: SpanContext = {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      traceFlags: 1,
      traceState: new TraceStateImpl() as any,
    };

    // Get parent span ID from context if available
    const parentSpanId = undefined; // Would extract from context

    const span = new SpanImpl(
      name,
      options,
      parentSpanId,
      spanContext,
      this.resource,
      this.instrumentationLibrary
    );

    return span;
  }

  startActiveSpan<F extends (span: Span) => ReturnType<F>>(
    name: string,
    arg2?: SpanOptions | Context | F,
    arg3?: Context | F,
    arg4?: F
  ): ReturnType<F> {
    let options: SpanOptions = {};
    let context: Context | undefined;
    let fn: F;

    if (typeof arg2 === 'function') {
      fn = arg2;
    } else if (typeof arg3 === 'function') {
      options = arg2 as SpanOptions;
      fn = arg3;
    } else if (typeof arg4 === 'function') {
      options = arg2 as SpanOptions;
      context = arg3 as Context;
      fn = arg4;
    } else {
      throw new Error('Invalid arguments');
    }

    const span = this.startSpan(name, options, context);

    try {
      return fn(span);
    } finally {
      span.end();
    }
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// Span processor interface
interface SpanProcessor {
  onStart(span: ReadableSpan, context: Context): void;
  onEnd(span: ReadableSpan): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

// Basic tracer provider
class BasicTracerProviderImpl implements TracerProvider {
  private tracers = new Map<string, Tracer>();
  private resource: Resource;
  private spanProcessors: SpanProcessor[] = [];

  constructor(config: { resource?: Resource } = {}) {
    this.resource = config.resource || {
      attributes: {},
      merge: (other) => this.resource,
    };
  }

  getTracer(name: string, version?: string): Tracer {
    const key = `${name}@${version || 'latest'}`;
    let tracer = this.tracers.get(key);

    if (!tracer) {
      const instrumentationLibrary: InstrumentationLibrary = {
        name,
        version,
      };

      tracer = new TracerImpl(
        instrumentationLibrary,
        this.resource,
        this.spanProcessors[0] // Use first processor
      );

      this.tracers.set(key, tracer);
    }

    return tracer;
  }

  addSpanProcessor(processor: SpanProcessor): void {
    this.spanProcessors.push(processor);
  }

  register(): void {
    // Register as global tracer provider
    globalTracerProvider = this;
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.spanProcessors.map((p) => p.shutdown()));
  }
}

// Global tracer provider
let globalTracerProvider: TracerProvider = new BasicTracerProviderImpl();

// Trace API
export const trace = {
  getTracer(name: string, version?: string): Tracer {
    return globalTracerProvider.getTracer(name, version);
  },

  getTracerProvider(): TracerProvider {
    return globalTracerProvider;
  },

  setTracerProvider(provider: TracerProvider): void {
    globalTracerProvider = provider;
  },

  setSpan(context: Context, span: Span): Context {
    // Would set span in context
    return context;
  },

  getSpan(context: Context): Span | undefined {
    // Would get span from context
    return undefined;
  },

  getActiveSpan(): Span | undefined {
    return undefined;
  },
};

export { SpanKind, SpanStatusCode };
export type { Span, Tracer, TracerProvider, SpanContext };
export { BasicTracerProviderImpl as BasicTracerProvider };
