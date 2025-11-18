# @opentelemetry/api - OpenTelemetry API - Elide Polyglot Showcase

> **One observability API for ALL languages** - TypeScript, Python, Ruby, and Java

Vendor-neutral API for distributed tracing, metrics, and logging with industry-standard telemetry collection.

## 🌟 Why This Matters

Different languages use different observability libraries with incompatible formats:
- `opentelemetry-api` in Python has different implementation
- `opentelemetry-api` in Ruby requires different setup
- Java OpenTelemetry uses different instrumentation
- Each language produces different telemetry formats

**Elide solves this** with ONE observability API that works in ALL languages consistently.

## ✨ Features

- ✅ Vendor-neutral tracing API
- ✅ Metrics collection
- ✅ Context propagation
- ✅ Baggage support
- ✅ Span events and attributes
- ✅ Trace correlation
- ✅ Multiple span kinds (server, client, producer, consumer)
- ✅ Status codes and error tracking
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { trace, SpanKind, SpanStatusCode } from './elide-opentelemetry-api.ts';

// Get a tracer
const tracer = trace.getTracer('my-service', '1.0.0');

// Create a span
tracer.startActiveSpan('operation', (span) => {
  span.setAttribute('user.id', '12345');
  span.setAttribute('operation.type', 'query');
  span.addEvent('processing');
  // Do work
});
```

### Python
```python
from elide import require
otel = require('./elide-opentelemetry-api.ts')

# Get a tracer
tracer = otel.trace.getTracer('my-service', '1.0.0')

# Create a span
def do_work(span):
    span.setAttribute('user.id', '12345')
    span.addEvent('processing')

tracer.startActiveSpan('operation', do_work)
```

### Ruby
```ruby
otel = Elide.require('./elide-opentelemetry-api.ts')

# Get a tracer
tracer = otel.trace.getTracer('my-service', '1.0.0')

# Create a span
tracer.startActiveSpan('operation') do |span|
  span.setAttribute('user.id', '12345')
  span.addEvent('processing')
end
```

### Java
```java
Value otel = context.eval("js", "require('./elide-opentelemetry-api.ts')");
Value tracer = otel.getMember("trace").invokeMember("getTracer", "my-service", "1.0.0");

// Create a span
tracer.invokeMember("startActiveSpan", "operation", (Consumer<Value>) span -> {
    span.invokeMember("setAttribute", "user.id", "12345");
    span.invokeMember("addEvent", "processing");
});
```

## 💡 Real-World Use Cases

### HTTP Server Tracing
```typescript
import { trace, SpanKind, SpanStatusCode } from './elide-opentelemetry-api.ts';

const tracer = trace.getTracer('http-server');

function handleRequest(req: any, res: any) {
  tracer.startActiveSpan('http.request', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': '/api/users/:id',
    },
  }, (span) => {
    try {
      // Process request
      const result = processRequest(req);

      span.setAttribute('http.status_code', 200);
      span.setStatus({ code: SpanStatusCode.OK });

      res.send(result);
    } catch (error) {
      span.setAttribute('http.status_code', 500);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    }
  });
}
```

### Database Query Tracing
```typescript
const tracer = trace.getTracer('database');

async function queryUsers() {
  return tracer.startActiveSpan('db.query', {
    kind: SpanKind.CLIENT,
    attributes: {
      'db.system': 'postgresql',
      'db.name': 'users_db',
      'db.statement': 'SELECT * FROM users WHERE active = true',
    },
  }, async (span) => {
    span.addEvent('query.start');

    const result = await db.query('SELECT * FROM users WHERE active = true');

    span.addEvent('query.complete', { rows: result.length });
    span.setAttribute('db.rows_affected', result.length);

    return result;
  });
}
```

### Microservice Communication
```typescript
const tracer = trace.getTracer('payment-service');

// Outgoing HTTP call
tracer.startActiveSpan('http.client.request', {
  kind: SpanKind.CLIENT,
  attributes: {
    'http.method': 'POST',
    'http.url': 'https://api.stripe.com/charges',
    'peer.service': 'stripe',
  },
}, (span) => {
  span.addEvent('request.start');

  // Make API call
  const response = callStripeAPI();

  span.addEvent('request.complete', {
    'http.status_code': response.status,
  });
});
```

### Message Queue Producer
```typescript
const tracer = trace.getTracer('message-producer');

function publishMessage(message: any) {
  tracer.startActiveSpan('queue.publish', {
    kind: SpanKind.PRODUCER,
    attributes: {
      'messaging.system': 'rabbitmq',
      'messaging.destination': 'orders',
      'messaging.message_id': message.id,
    },
  }, (span) => {
    span.addEvent('message.serializing');
    const serialized = JSON.stringify(message);

    span.addEvent('message.publishing');
    queue.publish('orders', serialized);

    span.addEvent('message.published');
  });
}
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different observability libraries

```
Node.js: @opentelemetry/api, custom instrumentation
Python: opentelemetry-api, different SDK
Ruby: opentelemetry-api, different setup
Java: OpenTelemetry Java agent

Result:
❌ Different telemetry formats
❌ Inconsistent instrumentation
❌ Complex trace correlation
❌ Different APIs to learn
```

### The Solution
**After**: One Elide OpenTelemetry API for all languages

```
┌────────────────────────────────────┐
│  Elide OpenTelemetry (TypeScript) │
│  elide-opentelemetry-api.ts       │
└────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ Vendor-neutral standard
✅ Consistent telemetry
✅ Easy trace correlation
✅ Shared configuration
```

## 📖 API Reference

### `trace.getTracer(name, version?)`
Get or create a tracer

### Tracer Methods
- `startSpan(name, options?)` - Create a new span
- `startActiveSpan(name, fn)` - Auto-manage span lifecycle
- `startActiveSpan(name, options, fn)` - Auto-manage with options

### Span Methods
- `setAttribute(key, value)` - Set a single attribute
- `setAttributes(attributes)` - Set multiple attributes
- `addEvent(name, attributes?, timestamp?)` - Add span event
- `setStatus(status)` - Set span status
- `updateName(name)` - Update span name
- `end(endTime?)` - End the span
- `isRecording()` - Check if span is recording
- `spanContext()` - Get span context

### Span Kinds
- `SpanKind.INTERNAL` - Internal operation
- `SpanKind.SERVER` - Server request
- `SpanKind.CLIENT` - Client request
- `SpanKind.PRODUCER` - Message producer
- `SpanKind.CONSUMER` - Message consumer

### Status Codes
- `SpanStatusCode.UNSET` - Default status
- `SpanStatusCode.OK` - Success
- `SpanStatusCode.ERROR` - Error occurred

## 🧪 Testing

```bash
elide run elide-opentelemetry-api.ts
```

## 📂 Files

- `elide-opentelemetry-api.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm @opentelemetry/api package](https://www.npmjs.com/package/@opentelemetry/api)
- [OpenTelemetry](https://opentelemetry.io/)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: Vendor-neutral observability API
- **Elide advantage**: One observability API for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One API to observe them all.*
