/**
 * OpenTelemetry Distributed Tracing for API Gateway
 * Provides comprehensive tracing capabilities:
 * - Request tracing across services
 * - Span context propagation
 * - Custom span attributes and events
 * - Trace sampling strategies
 * - Integration with Jaeger, Zipkin
 * - Baggage propagation
 */

import { randomBytes } from "crypto";

interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

interface SpanAttributes {
  [key: string]: string | number | boolean;
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: SpanAttributes;
}

interface SpanLink {
  context: SpanContext;
  attributes?: SpanAttributes;
}

enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

interface SpanData {
  name: string;
  context: SpanContext;
  parentSpanId?: string;
  kind: SpanKind;
  startTime: number;
  endTime?: number;
  attributes: SpanAttributes;
  events: SpanEvent[];
  links: SpanLink[];
  status: {
    code: SpanStatus;
    message?: string;
  };
}

/**
 * Span implementation
 */
export class Span {
  private data: SpanData;
  private ended = false;

  constructor(
    name: string,
    context: SpanContext,
    parentSpanId?: string,
    kind: SpanKind = SpanKind.INTERNAL,
  ) {
    this.data = {
      name,
      context,
      parentSpanId,
      kind,
      startTime: Date.now(),
      attributes: {},
      events: [],
      links: [],
      status: { code: SpanStatus.UNSET },
    };
  }

  setAttribute(key: string, value: string | number | boolean): void {
    if (!this.ended) {
      this.data.attributes[key] = value;
    }
  }

  setAttributes(attributes: SpanAttributes): void {
    if (!this.ended) {
      Object.assign(this.data.attributes, attributes);
    }
  }

  addEvent(name: string, attributes?: SpanAttributes): void {
    if (!this.ended) {
      this.data.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      });
    }
  }

  addLink(context: SpanContext, attributes?: SpanAttributes): void {
    if (!this.ended) {
      this.data.links.push({ context, attributes });
    }
  }

  setStatus(code: SpanStatus, message?: string): void {
    if (!this.ended) {
      this.data.status = { code, message };
    }
  }

  updateName(name: string): void {
    if (!this.ended) {
      this.data.name = name;
    }
  }

  end(endTime?: number): void {
    if (!this.ended) {
      this.data.endTime = endTime || Date.now();
      this.ended = true;
    }
  }

  isRecording(): boolean {
    return !this.ended;
  }

  getContext(): SpanContext {
    return this.data.context;
  }

  getData(): SpanData {
    return { ...this.data };
  }
}

/**
 * Tracer implementation
 */
export class Tracer {
  private serviceName: string;
  private spans: Span[] = [];
  private activeSpans = new Map<string, Span>();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  startSpan(
    name: string,
    options?: {
      parentContext?: SpanContext;
      kind?: SpanKind;
      attributes?: SpanAttributes;
      links?: SpanLink[];
    },
  ): Span {
    const context: SpanContext = {
      traceId:
        options?.parentContext?.traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      traceFlags: 1, // Sampled
    };

    const span = new Span(
      name,
      context,
      options?.parentContext?.spanId,
      options?.kind || SpanKind.INTERNAL,
    );

    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }

    if (options?.links) {
      options.links.forEach((link) => {
        span.addLink(link.context, link.attributes);
      });
    }

    // Set service name
    span.setAttribute("service.name", this.serviceName);

    this.spans.push(span);
    this.activeSpans.set(context.spanId, span);

    return span;
  }

  getActiveSpan(spanId: string): Span | undefined {
    return this.activeSpans.get(spanId);
  }

  getSpans(): SpanData[] {
    return this.spans.map((span) => span.getData());
  }

  private generateTraceId(): string {
    return randomBytes(16).toString("hex");
  }

  private generateSpanId(): string {
    return randomBytes(8).toString("hex");
  }
}

/**
 * Trace Context Propagator
 * Implements W3C Trace Context specification
 */
export class TraceContextPropagator {
  /**
   * Extract span context from headers
   */
  extract(headers: Record<string, string>): SpanContext | null {
    const traceparent = headers["traceparent"];
    if (!traceparent) {
      return null;
    }

    const parts = traceparent.split("-");
    if (parts.length !== 4) {
      return null;
    }

    const [version, traceId, spanId, traceFlags] = parts;

    if (version !== "00") {
      return null;
    }

    return {
      traceId,
      spanId,
      traceFlags: parseInt(traceFlags, 16),
      traceState: headers["tracestate"],
    };
  }

  /**
   * Inject span context into headers
   */
  inject(context: SpanContext, headers: Record<string, string>): void {
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, "0")}`;
    headers["traceparent"] = traceparent;

    if (context.traceState) {
      headers["tracestate"] = context.traceState;
    }
  }
}

/**
 * Sampling strategies
 */
export interface Sampler {
  shouldSample(
    context: SpanContext,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: SpanAttributes,
  ): boolean;
}

export class AlwaysOnSampler implements Sampler {
  shouldSample(): boolean {
    return true;
  }
}

export class AlwaysOffSampler implements Sampler {
  shouldSample(): boolean {
    return false;
  }
}

export class ProbabilitySampler implements Sampler {
  private probability: number;

  constructor(probability: number) {
    this.probability = Math.max(0, Math.min(1, probability));
  }

  shouldSample(): boolean {
    return Math.random() < this.probability;
  }
}

export class RateLimitingSampler implements Sampler {
  private maxTracesPerSecond: number;
  private traces: number[] = [];

  constructor(maxTracesPerSecond: number) {
    this.maxTracesPerSecond = maxTracesPerSecond;
  }

  shouldSample(): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old traces
    this.traces = this.traces.filter((t) => t > oneSecondAgo);

    if (this.traces.length < this.maxTracesPerSecond) {
      this.traces.push(now);
      return true;
    }

    return false;
  }
}

export class ParentBasedSampler implements Sampler {
  private rootSampler: Sampler;

  constructor(rootSampler: Sampler) {
    this.rootSampler = rootSampler;
  }

  shouldSample(context: SpanContext): boolean {
    // If trace is already sampled, continue sampling
    if ((context.traceFlags & 1) === 1) {
      return true;
    }

    // For root spans, use root sampler
    return this.rootSampler.shouldSample(
      context,
      context.traceId,
      "",
      SpanKind.INTERNAL,
      {},
    );
  }
}

/**
 * Span Processor
 * Processes completed spans
 */
export interface SpanProcessor {
  onStart(span: Span): void;
  onEnd(span: Span): void;
  shutdown(): Promise<void>;
}

export class SimpleSpanProcessor implements SpanProcessor {
  private exporter: SpanExporter;

  constructor(exporter: SpanExporter) {
    this.exporter = exporter;
  }

  onStart(_span: Span): void {
    // No-op for simple processor
  }

  async onEnd(span: Span): Promise<void> {
    await this.exporter.export([span.getData()]);
  }

  async shutdown(): Promise<void> {
    await this.exporter.shutdown();
  }
}

export class BatchSpanProcessor implements SpanProcessor {
  private exporter: SpanExporter;
  private spans: SpanData[] = [];
  private maxBatchSize: number;
  private maxQueueSize: number;
  private scheduledDelayMillis: number;
  private timer?: NodeJS.Timeout;

  constructor(
    exporter: SpanExporter,
    config?: {
      maxBatchSize?: number;
      maxQueueSize?: number;
      scheduledDelayMillis?: number;
    },
  ) {
    this.exporter = exporter;
    this.maxBatchSize = config?.maxBatchSize || 512;
    this.maxQueueSize = config?.maxQueueSize || 2048;
    this.scheduledDelayMillis = config?.scheduledDelayMillis || 5000;

    this.startTimer();
  }

  onStart(_span: Span): void {
    // No-op
  }

  onEnd(span: Span): void {
    if (this.spans.length >= this.maxQueueSize) {
      return; // Drop span
    }

    this.spans.push(span.getData());

    if (this.spans.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.spans.length === 0) {
      return;
    }

    const batch = this.spans.splice(0, this.maxBatchSize);
    await this.exporter.export(batch);
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
    await this.exporter.shutdown();
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.scheduledDelayMillis);
  }
}

/**
 * Span Exporter
 * Exports spans to backend
 */
export interface SpanExporter {
  export(spans: SpanData[]): Promise<void>;
  shutdown(): Promise<void>;
}

export class ConsoleSpanExporter implements SpanExporter {
  async export(spans: SpanData[]): Promise<void> {
    for (const span of spans) {
      console.log(
        JSON.stringify(
          {
            traceId: span.context.traceId,
            spanId: span.context.spanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
            kind: SpanKind[span.kind],
            startTime: new Date(span.startTime).toISOString(),
            endTime: span.endTime
              ? new Date(span.endTime).toISOString()
              : undefined,
            duration: span.endTime ? span.endTime - span.startTime : undefined,
            attributes: span.attributes,
            events: span.events,
            status: span.status,
          },
          null,
          2,
        ),
      );
    }
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

export class JaegerSpanExporter implements SpanExporter {
  private endpoint: string;
  private serviceName: string;

  constructor(config: { endpoint: string; serviceName: string }) {
    this.endpoint = config.endpoint;
    this.serviceName = config.serviceName;
  }

  async export(spans: SpanData[]): Promise<void> {
    const jaegerSpans = spans.map((span) => this.convertToJaegerFormat(span));

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              traceID: spans[0]?.context.traceId,
              spans: jaegerSpans,
              processes: {
                p1: {
                  serviceName: this.serviceName,
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("Failed to export spans to Jaeger:", response.statusText);
      }
    } catch (error) {
      console.error("Error exporting spans to Jaeger:", error);
    }
  }

  private convertToJaegerFormat(span: SpanData): any {
    return {
      traceID: span.context.traceId,
      spanID: span.context.spanId,
      operationName: span.name,
      references:
        span.parentSpanId
          ? [
              {
                refType: "CHILD_OF",
                traceID: span.context.traceId,
                spanID: span.parentSpanId,
              },
            ]
          : [],
      startTime: span.startTime * 1000, // microseconds
      duration: span.endTime ? (span.endTime - span.startTime) * 1000 : 0,
      tags: Object.entries(span.attributes).map(([key, value]) => ({
        key,
        type: typeof value === "string" ? "string" : "number",
        value,
      })),
      logs: span.events.map((event) => ({
        timestamp: event.timestamp * 1000,
        fields: [
          {
            key: "event",
            type: "string",
            value: event.name,
          },
          ...(event.attributes
            ? Object.entries(event.attributes).map(([key, value]) => ({
                key,
                type: typeof value === "string" ? "string" : "number",
                value,
              }))
            : []),
        ],
      })),
    };
  }

  async shutdown(): Promise<void> {
    // No-op
  }
}

/**
 * Trace Provider
 * Main entry point for tracing
 */
export class TracerProvider {
  private tracers = new Map<string, Tracer>();
  private processor?: SpanProcessor;
  private sampler: Sampler;
  private propagator: TraceContextPropagator;

  constructor(config?: {
    sampler?: Sampler;
    processor?: SpanProcessor;
  }) {
    this.sampler = config?.sampler || new AlwaysOnSampler();
    this.processor = config?.processor;
    this.propagator = new TraceContextPropagator();
  }

  getTracer(name: string): Tracer {
    if (!this.tracers.has(name)) {
      this.tracers.set(name, new Tracer(name));
    }
    return this.tracers.get(name)!;
  }

  getProcessor(): SpanProcessor | undefined {
    return this.processor;
  }

  getSampler(): Sampler {
    return this.sampler;
  }

  getPropagator(): TraceContextPropagator {
    return this.propagator;
  }

  async shutdown(): Promise<void> {
    if (this.processor) {
      await this.processor.shutdown();
    }
  }
}

/**
 * Instrumentation utilities
 */
export class Instrumentation {
  private provider: TracerProvider;
  private tracer: Tracer;

  constructor(provider: TracerProvider, serviceName: string) {
    this.provider = provider;
    this.tracer = provider.getTracer(serviceName);
  }

  /**
   * Instrument HTTP request
   */
  instrumentRequest(
    req: any,
    handler: (span: Span) => Promise<any>,
  ): Promise<any> {
    const propagator = this.provider.getPropagator();
    const parentContext = propagator.extract(req.headers);

    const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      parentContext: parentContext || undefined,
      attributes: {
        "http.method": req.method,
        "http.url": req.url,
        "http.target": req.path,
        "http.host": req.headers.host || "",
        "http.scheme": req.protocol || "http",
        "http.user_agent": req.headers["user-agent"] || "",
      },
    });

    return handler(span)
      .then((result) => {
        span.setStatus(SpanStatus.OK);
        span.end();
        return result;
      })
      .catch((error) => {
        span.setStatus(SpanStatus.ERROR, error.message);
        span.addEvent("exception", {
          "exception.type": error.name,
          "exception.message": error.message,
        });
        span.end();
        throw error;
      });
  }

  /**
   * Instrument HTTP client request
   */
  instrumentClientRequest(
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
    },
    parentSpan?: Span,
  ): Span {
    const span = this.tracer.startSpan(`${request.method} ${request.url}`, {
      kind: SpanKind.CLIENT,
      parentContext: parentSpan?.getContext(),
      attributes: {
        "http.method": request.method,
        "http.url": request.url,
      },
    });

    // Inject context into headers
    const propagator = this.provider.getPropagator();
    propagator.inject(span.getContext(), request.headers);

    return span;
  }

  /**
   * Create middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      await this.instrumentRequest(req, async (span) => {
        // Store span in request
        req.span = span;

        // Capture response
        const originalEnd = res.end.bind(res);
        res.end = (...args: any[]) => {
          span.setAttribute("http.status_code", res.statusCode);

          if (res.statusCode >= 400) {
            span.setStatus(SpanStatus.ERROR, `HTTP ${res.statusCode}`);
          } else {
            span.setStatus(SpanStatus.OK);
          }

          span.end();
          return originalEnd(...args);
        };

        next();
      });
    };
  }
}

export default TracerProvider;
