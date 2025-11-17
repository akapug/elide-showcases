# OpenTelemetry Clone - Elide Implementation

A production-ready OpenTelemetry observability framework ported to Elide, providing unified tracing, metrics, and logging.

## Features

- **Tracing**: Distributed tracing with spans and context propagation
- **Metrics**: Counter, gauge, histogram, and observable metrics
- **Logging**: Structured logging with correlation
- **Exporters**: OTLP, Jaeger, Zipkin, Prometheus exporters
- **Instrumentation**: Auto-instrumentation for popular frameworks
- **Context Management**: Automatic context propagation
- **Baggage**: Cross-process metadata propagation
- **Sampling**: Configurable sampling strategies
- **TypeScript Support**: Full type definitions

## Installation

```bash
npm install @elide/opentelemetry-clone
```

## Quick Start

### Tracing

```typescript
import {
  NodeSDK,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@elide/opentelemetry-clone';

// Initialize SDK
const sdk = new NodeSDK({
  serviceName: 'my-service',
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
});

sdk.start();

// Create spans
import { trace } from '@elide/opentelemetry-clone';

const tracer = trace.getTracer('my-tracer');

const span = tracer.startSpan('my-operation');
span.setAttribute('user.id', '123');
span.addEvent('Processing started');

try {
  // Do work
  await doWork();
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
} finally {
  span.end();
}

// Clean up
await sdk.shutdown();
```

### Metrics

```typescript
import { metrics } from '@elide/opentelemetry-clone';

const meter = metrics.getMeter('my-meter');

// Create counter
const counter = meter.createCounter('requests', {
  description: 'Total requests',
  unit: '1',
});

counter.add(1, { method: 'GET', status: '200' });

// Create histogram
const histogram = meter.createHistogram('request.duration', {
  description: 'Request duration',
  unit: 'ms',
});

histogram.record(150, { route: '/api/users' });

// Create observable gauge
const gauge = meter.createObservableGauge('memory.usage', {
  description: 'Memory usage',
  unit: 'bytes',
});

gauge.addCallback((observableResult) => {
  observableResult.observe(process.memoryUsage().heapUsed, {
    type: 'heap',
  });
});
```

### Logging

```typescript
import { logs } from '@elide/opentelemetry-clone';

const logger = logs.getLogger('my-logger');

logger.emit({
  severityText: 'INFO',
  body: 'User logged in',
  attributes: {
    'user.id': '123',
    'user.email': 'user@example.com',
  },
});
```

## Tracing

### Creating Spans

```typescript
import { trace, SpanKind, SpanStatusCode } from '@elide/opentelemetry-clone';

const tracer = trace.getTracer('my-service');

// Basic span
const span = tracer.startSpan('operation');
span.end();

// Span with options
const span = tracer.startSpan('http.request', {
  kind: SpanKind.CLIENT,
  attributes: {
    'http.method': 'GET',
    'http.url': 'https://api.example.com/users',
  },
});

// Set status
span.setStatus({ code: SpanStatusCode.OK });
span.setStatus({ code: SpanStatusCode.ERROR, message: 'Connection failed' });

// Add events
span.addEvent('cache.miss');
span.addEvent('retry', { attempt: 2 });

// Record exception
try {
  throw new Error('Something went wrong');
} catch (error) {
  span.recordException(error);
}

span.end();
```

### Context Propagation

```typescript
import { trace, context } from '@elide/opentelemetry-clone';

const tracer = trace.getTracer('my-service');

// Start active span
const span = tracer.startSpan('parent-operation');

// Execute code with active span
context.with(trace.setSpan(context.active(), span), () => {
  // This span is automatically linked to parent
  const childSpan = tracer.startSpan('child-operation');
  childSpan.end();
});

span.end();

// Using startActiveSpan helper
await tracer.startActiveSpan('operation', async (span) => {
  try {
    await doWork();
    span.setStatus({ code: SpanStatusCode.OK });
  } finally {
    span.end();
  }
});
```

### Span Links

```typescript
const span = tracer.startSpan('operation', {
  links: [
    {
      context: relatedSpan.spanContext(),
      attributes: { relationship: 'follows_from' },
    },
  ],
});
```

### Span Attributes

```typescript
// Set attributes
span.setAttribute('user.id', '123');
span.setAttribute('http.status_code', 200);
span.setAttributes({
  'db.system': 'postgresql',
  'db.name': 'users',
  'db.statement': 'SELECT * FROM users WHERE id = $1',
});

// Semantic conventions
import { SemanticAttributes } from '@elide/opentelemetry-clone';

span.setAttributes({
  [SemanticAttributes.HTTP_METHOD]: 'GET',
  [SemanticAttributes.HTTP_URL]: 'https://api.example.com/users',
  [SemanticAttributes.HTTP_STATUS_CODE]: 200,
});
```

## Metrics

### Counter

```typescript
const counter = meter.createCounter('http.requests', {
  description: 'Total HTTP requests',
  unit: '1',
});

// Add value
counter.add(1);

// Add with attributes
counter.add(1, { method: 'GET', status: '200' });

// Bound counter (reuse attributes)
const boundCounter = counter.bind({ method: 'POST', status: '201' });
boundCounter.add(1);
```

### UpDownCounter

```typescript
const upDownCounter = meter.createUpDownCounter('active.connections', {
  description: 'Active connections',
  unit: '1',
});

upDownCounter.add(1); // Connection opened
upDownCounter.add(-1); // Connection closed
```

### Histogram

```typescript
const histogram = meter.createHistogram('http.duration', {
  description: 'HTTP request duration',
  unit: 'ms',
});

histogram.record(125, { route: '/api/users', method: 'GET' });
histogram.record(450, { route: '/api/posts', method: 'POST' });
```

### Observable Gauges

```typescript
// Current value
const cpuGauge = meter.createObservableGauge('cpu.usage', {
  description: 'CPU usage',
  unit: '%',
});

cpuGauge.addCallback((observableResult) => {
  const usage = getCPUUsage();
  observableResult.observe(usage, { core: '0' });
});

// Observable counter (cumulative)
const processedCounter = meter.createObservableCounter('items.processed', {
  description: 'Total processed items',
  unit: '1',
});

processedCounter.addCallback((observableResult) => {
  const count = getProcessedCount();
  observableResult.observe(count, { status: 'completed' });
});
```

### Views and Aggregation

```typescript
import { MeterProvider, View, Aggregation } from '@elide/opentelemetry-clone';

const meterProvider = new MeterProvider({
  views: [
    new View({
      name: 'http.duration',
      aggregation: Aggregation.Histogram({
        boundaries: [0, 100, 300, 500, 1000, 3000, 5000],
      }),
    }),
    new View({
      name: 'http.requests',
      aggregation: Aggregation.Sum(),
      attributeKeys: ['method', 'status'], // Only keep these attributes
    }),
  ],
});

metrics.setGlobalMeterProvider(meterProvider);
```

## Logging

### Log Records

```typescript
import { logs, SeverityNumber } from '@elide/opentelemetry-clone';

const logger = logs.getLogger('my-logger');

// Basic log
logger.emit({
  severityText: 'INFO',
  severityNumber: SeverityNumber.INFO,
  body: 'Application started',
});

// With attributes
logger.emit({
  severityText: 'ERROR',
  severityNumber: SeverityNumber.ERROR,
  body: 'Failed to connect to database',
  attributes: {
    'error.type': 'ConnectionError',
    'db.host': 'localhost',
    'db.port': 5432,
  },
});

// With context correlation
logger.emit({
  severityText: 'INFO',
  body: 'User action',
  attributes: {
    'user.id': '123',
  },
  traceId: span.spanContext().traceId,
  spanId: span.spanContext().spanId,
  traceFlags: span.spanContext().traceFlags,
});
```

## Exporters

### OTLP Exporter

```typescript
import {
  OTLPTraceExporter,
  OTLPMetricExporter,
  OTLPLogExporter,
} from '@elide/opentelemetry-clone';

// Trace exporter
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
  headers: {
    'api-key': 'your-api-key',
  },
});

// Metric exporter
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4318/v1/metrics',
  temporalityPreference: 'cumulative',
});

// Log exporter
const logExporter = new OTLPLogExporter({
  url: 'http://localhost:4318/v1/logs',
});
```

### Jaeger Exporter

```typescript
import { JaegerExporter } from '@elide/opentelemetry-clone';

const exporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
  serviceName: 'my-service',
  tags: {
    environment: 'production',
    version: '1.0.0',
  },
});
```

### Zipkin Exporter

```typescript
import { ZipkinExporter } from '@elide/opentelemetry-clone';

const exporter = new ZipkinExporter({
  url: 'http://localhost:9411/api/v2/spans',
  serviceName: 'my-service',
});
```

### Prometheus Exporter

```typescript
import { PrometheusExporter } from '@elide/opentelemetry-clone';

const exporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

// Start metrics server
await exporter.startServer();

// Metrics available at http://localhost:9464/metrics
```

### Console Exporters

```typescript
import {
  ConsoleSpanExporter,
  ConsoleMetricExporter,
  ConsoleLogExporter,
} from '@elide/opentelemetry-clone';

const spanExporter = new ConsoleSpanExporter();
const metricExporter = new ConsoleMetricExporter();
const logExporter = new ConsoleLogExporter();
```

## Instrumentation

### HTTP Instrumentation

```typescript
import { HttpInstrumentation } from '@elide/opentelemetry-clone';

const httpInstrumentation = new HttpInstrumentation({
  requestHook: (span, request) => {
    span.setAttribute('custom.header', request.headers['x-custom']);
  },
  responseHook: (span, response) => {
    span.setAttribute('response.size', response.headers['content-length']);
  },
  ignoreIncomingPaths: ['/health', '/metrics'],
});

httpInstrumentation.enable();
```

### Express Instrumentation

```typescript
import { ExpressInstrumentation } from '@elide/opentelemetry-clone';

const expressInstrumentation = new ExpressInstrumentation({
  requestHook: (span, info) => {
    span.setAttribute('express.version', info.moduleVersion);
  },
});

expressInstrumentation.enable();
```

### Database Instrumentation

```typescript
import { PostgresInstrumentation } from '@elide/opentelemetry-clone';

const pgInstrumentation = new PostgresInstrumentation({
  enhancedDatabaseReporting: true,
  requestHook: (span, queryConfig) => {
    span.setAttribute('db.query.hash', hashQuery(queryConfig.text));
  },
});

pgInstrumentation.enable();
```

### Auto Instrumentation

```typescript
import { registerInstrumentations } from '@elide/opentelemetry-clone';
import {
  HttpInstrumentation,
  ExpressInstrumentation,
  PostgresInstrumentation,
} from '@elide/opentelemetry-clone';

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PostgresInstrumentation(),
  ],
});
```

## Context and Baggage

### Baggage

```typescript
import { propagation, baggageUtils } from '@elide/opentelemetry-clone';

// Set baggage
const ctx = baggageUtils.setBaggage(
  context.active(),
  'user.id',
  '123'
);

// Get baggage
const userId = baggageUtils.getBaggage(ctx, 'user.id');

// Set multiple baggage items
const ctx2 = baggageUtils.setBaggageMultiple(context.active(), {
  'user.id': '123',
  'request.id': 'req-456',
  'tenant.id': 'tenant-789',
});
```

### Context Propagation

```typescript
import { W3CTraceContextPropagator } from '@elide/opentelemetry-clone';

const propagator = new W3CTraceContextPropagator();

// Inject context into headers
const headers: Record<string, string> = {};
propagator.inject(context.active(), headers, {
  set: (carrier, key, value) => {
    carrier[key] = value;
  },
});

// Extract context from headers
const extractedContext = propagator.extract(context.active(), headers, {
  get: (carrier, key) => carrier[key],
});
```

## Sampling

### Probability Sampler

```typescript
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@elide/opentelemetry-clone';

// Sample 10% of traces
const sampler = new TraceIdRatioBasedSampler(0.1);

// Parent-based sampling (follow parent decision)
const parentBasedSampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(0.1),
});
```

### Always On/Off Samplers

```typescript
import { AlwaysOnSampler, AlwaysOffSampler } from '@elide/opentelemetry-clone';

const alwaysOn = new AlwaysOnSampler();
const alwaysOff = new AlwaysOffSampler();
```

### Custom Sampler

```typescript
import { Sampler, SamplingDecision } from '@elide/opentelemetry-clone';

class CustomSampler implements Sampler {
  shouldSample(context, traceId, spanName, spanKind, attributes, links) {
    // Sample all errors
    if (attributes['error'] === true) {
      return {
        decision: SamplingDecision.RECORD_AND_SAMPLED,
      };
    }

    // Sample 10% of others
    const ratio = parseInt(traceId.slice(0, 8), 16) / 0xffffffff;
    return {
      decision:
        ratio < 0.1
          ? SamplingDecision.RECORD_AND_SAMPLED
          : SamplingDecision.NOT_RECORD,
    };
  }
}
```

## SDK Configuration

### Node SDK

```typescript
import {
  NodeSDK,
  BatchSpanProcessor,
  OTLPTraceExporter,
  PeriodicExportingMetricReader,
  OTLPMetricExporter,
} from '@elide/opentelemetry-clone';

const sdk = new NodeSDK({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',

  // Tracing
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces',
    })
  ),

  // Metrics
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 60000,
  }),

  // Resource
  resource: {
    attributes: {
      'service.name': 'my-service',
      'service.version': '1.0.0',
      'deployment.environment': 'production',
    },
  },
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sdk.shutdown();
  process.exit(0);
});
```

### Manual Configuration

```typescript
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
  PrometheusExporter,
} from '@elide/opentelemetry-clone';

// Tracing
const tracerProvider = new BasicTracerProvider({
  resource: {
    attributes: {
      'service.name': 'my-service',
    },
  },
});

tracerProvider.addSpanProcessor(
  new BatchSpanProcessor(new ConsoleSpanExporter())
);

tracerProvider.register();

// Metrics
const meterProvider = new MeterProvider({
  resource: {
    attributes: {
      'service.name': 'my-service',
    },
  },
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new PrometheusExporter({ port: 9464 }),
      exportIntervalMillis: 60000,
    }),
  ],
});

metrics.setGlobalMeterProvider(meterProvider);
```

## Testing

```typescript
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
  BasicTracerProvider,
} from '@elide/opentelemetry-clone';

describe('Tracing', () => {
  let exporter: InMemorySpanExporter;
  let provider: BasicTracerProvider;

  beforeEach(() => {
    exporter = new InMemorySpanExporter();
    provider = new BasicTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
  });

  afterEach(() => {
    provider.shutdown();
  });

  it('should create spans', () => {
    const tracer = trace.getTracer('test');
    const span = tracer.startSpan('test-span');
    span.end();

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('test-span');
  });
});
```

## Performance Considerations

- Use BatchSpanProcessor for production (not SimpleSpanProcessor)
- Configure appropriate batch sizes and timeouts
- Use sampling to reduce overhead
- Minimize attribute cardinality
- Use bound instruments for repeated measurements
- Consider async instrumentation hooks

## License

MIT License - See LICENSE file for details

## Credits

Ported to Elide from the original OpenTelemetry project. Original implementations by the OpenTelemetry community.

## Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.
