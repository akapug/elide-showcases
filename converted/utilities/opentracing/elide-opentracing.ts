/**
 * opentracing - OpenTracing API
 *
 * Vendor-neutral distributed tracing API for applications.
 * **POLYGLOT SHOWCASE**: Standard tracing API for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/opentracing (~1M+ downloads/week)
 *
 * Features:
 * - OpenTracing specification
 * - Vendor-neutral API
 * - Span management
 * - Context propagation
 * - Baggage items
 * - Standard formats
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Standard API across all languages
 * - ONE tracing interface on Elide
 * - Vendor-agnostic implementation
 * - Universal trace format
 *
 * Use cases:
 * - Distributed tracing
 * - Microservices monitoring
 * - Performance tracking
 * - Service mesh integration
 *
 * Package has ~1M+ downloads/week on npm!
 */

const FORMAT_HTTP_HEADERS = 'http_headers';
const FORMAT_TEXT_MAP = 'text_map';
const FORMAT_BINARY = 'binary';

const REFERENCE_CHILD_OF = 'child_of';
const REFERENCE_FOLLOWS_FROM = 'follows_from';

interface SpanContext {
  toTraceId(): string;
  toSpanId(): string;
}

interface Reference {
  type(): string;
  referencedContext(): SpanContext;
}

interface SpanOptions {
  references?: Reference[];
  tags?: Record<string, any>;
  startTime?: number;
}

class SpanContextImpl implements SpanContext {
  private traceId: string;
  private spanId: string;
  private baggage: Map<string, string>;

  constructor(traceId: string, spanId: string, baggage: Map<string, string> = new Map()) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.baggage = baggage;
  }

  toTraceId(): string {
    return this.traceId;
  }

  toSpanId(): string {
    return this.spanId;
  }

  getBaggage(): Map<string, string> {
    return new Map(this.baggage);
  }
}

class Span {
  private _context: SpanContextImpl;
  private _operationName: string;
  private _tags: Map<string, any>;
  private _logs: Array<{ timestamp: number; fields: Record<string, any> }>;
  private _startTime: number;
  private _finishTime?: number;

  constructor(operationName: string, context: SpanContextImpl, startTime: number = Date.now()) {
    this._operationName = operationName;
    this._context = context;
    this._startTime = startTime;
    this._tags = new Map();
    this._logs = [];
  }

  context(): SpanContext {
    return this._context;
  }

  setTag(key: string, value: any): this {
    this._tags.set(key, value);
    return this;
  }

  addTags(tags: Record<string, any>): this {
    Object.entries(tags).forEach(([key, value]) => {
      this._tags.set(key, value);
    });
    return this;
  }

  log(fields: Record<string, any>, timestamp?: number): this {
    this._logs.push({
      timestamp: timestamp || Date.now(),
      fields,
    });
    return this;
  }

  logEvent(eventName: string, payload?: any): this {
    return this.log({ event: eventName, ...payload });
  }

  setBaggageItem(key: string, value: string): this {
    this._context.getBaggage().set(key, value);
    return this;
  }

  getBaggageItem(key: string): string | undefined {
    return this._context.getBaggage().get(key);
  }

  setOperationName(name: string): this {
    this._operationName = name;
    return this;
  }

  finish(finishTime?: number): void {
    this._finishTime = finishTime || Date.now();
    const duration = this._finishTime - this._startTime;
    console.log(`[OpenTracing] Span finished: ${this._operationName} (${duration}ms)`);
  }
}

class Tracer {
  startSpan(operationName: string, options?: SpanOptions): Span {
    const context = new SpanContextImpl(
      this.generateId(),
      this.generateId()
    );

    const span = new Span(operationName, context, options?.startTime);

    if (options?.tags) {
      span.addTags(options.tags);
    }

    return span;
  }

  inject(spanContext: SpanContext, format: string, carrier: any): void {
    if (format === FORMAT_HTTP_HEADERS || format === FORMAT_TEXT_MAP) {
      carrier['ot-tracer-traceid'] = spanContext.toTraceId();
      carrier['ot-tracer-spanid'] = spanContext.toSpanId();
    }
  }

  extract(format: string, carrier: any): SpanContext | null {
    if (format === FORMAT_HTTP_HEADERS || format === FORMAT_TEXT_MAP) {
      const traceId = carrier['ot-tracer-traceid'];
      const spanId = carrier['ot-tracer-spanid'];

      if (traceId && spanId) {
        return new SpanContextImpl(traceId, spanId);
      }
    }

    return null;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Global tracer
let globalTracer: Tracer = new Tracer();

function initGlobalTracer(tracer: Tracer): void {
  globalTracer = tracer;
}

function globalTracer_(): Tracer {
  return globalTracer;
}

export {
  Tracer,
  Span,
  SpanContext,
  SpanOptions,
  FORMAT_HTTP_HEADERS,
  FORMAT_TEXT_MAP,
  FORMAT_BINARY,
  REFERENCE_CHILD_OF,
  REFERENCE_FOLLOWS_FROM,
  initGlobalTracer,
  globalTracer_ as globalTracer,
};

export default { Tracer, Span, initGlobalTracer, globalTracer: globalTracer_ };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 opentracing - OpenTracing API (POLYGLOT!)\n");

  console.log("=== Initialize Tracer ===");
  const tracer = new Tracer();
  initGlobalTracer(tracer);
  console.log('Global tracer initialized');
  console.log();

  console.log("=== Start Span ===");
  const span = tracer.startSpan('http.request', {
    tags: {
      'http.method': 'GET',
      'http.url': '/api/users',
    },
  });

  span.setTag('http.status_code', 200);
  span.log({ event: 'request_received' });
  span.finish();
  console.log();

  console.log("=== Inject/Extract Context ===");
  const parentSpan = tracer.startSpan('parent_operation');
  const headers: Record<string, string> = {};

  tracer.inject(parentSpan.context(), FORMAT_HTTP_HEADERS, headers);
  console.log('Injected headers:', headers);

  const extractedContext = tracer.extract(FORMAT_HTTP_HEADERS, headers);
  console.log('Extracted context:', {
    traceId: extractedContext?.toTraceId(),
    spanId: extractedContext?.toSpanId(),
  });
  parentSpan.finish();
  console.log();

  console.log("=== Baggage Items ===");
  const baggageSpan = tracer.startSpan('baggage_test');
  baggageSpan.setBaggageItem('user.id', 'user-123');
  baggageSpan.setBaggageItem('session.id', 'sess-456');

  console.log('Baggage items:', {
    userId: baggageSpan.getBaggageItem('user.id'),
    sessionId: baggageSpan.getBaggageItem('session.id'),
  });
  baggageSpan.finish();
  console.log();

  console.log("=== Logging Events ===");
  const logSpan = tracer.startSpan('database.query');
  logSpan.log({ event: 'query_start', statement: 'SELECT * FROM users' });
  logSpan.log({ event: 'query_end', rows: 100 });
  logSpan.logEvent('cache_hit', { key: 'users:all' });
  logSpan.finish();
  console.log();

  console.log("=== Multiple Spans ===");
  const rootSpan = tracer.startSpan('api.request');
  rootSpan.setTag('endpoint', '/api/checkout');

  const authSpan = tracer.startSpan('auth.verify');
  authSpan.setTag('user.authenticated', true);
  authSpan.finish();

  const dbSpan = tracer.startSpan('db.query');
  dbSpan.setTag('db.statement', 'SELECT * FROM orders');
  dbSpan.finish();

  rootSpan.finish();
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Distributed tracing");
  console.log("- Microservices monitoring");
  console.log("- Performance tracking");
  console.log("- Service mesh integration");
  console.log("- ~1M+ downloads/week on npm!");
}
