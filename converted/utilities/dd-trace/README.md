# dd-trace - Datadog APM Tracing Library - Elide Polyglot Showcase

> **One APM tracing library for ALL languages** - TypeScript, Python, Ruby, and Java

Application Performance Monitoring and distributed tracing for modern applications with automatic instrumentation.

## 🌟 Why This Matters

Different languages use different APM libraries with incompatible trace formats:
- `ddtrace` in Python has different API than dd-trace
- `ddtrace` in Ruby requires different configuration
- Datadog Java agent uses bytecode instrumentation
- Each language produces different trace formats

**Elide solves this** with ONE APM library that works in ALL languages with a consistent API.

## ✨ Features

- ✅ Distributed tracing across services
- ✅ Automatic instrumentation
- ✅ Custom span creation
- ✅ Trace context propagation
- ✅ Performance metrics
- ✅ Error tracking
- ✅ Service dependency mapping
- ✅ Resource tagging
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import ddtrace from './elide-dd-trace.ts';

// Initialize tracer
const tracer = ddtrace.init({
  service: 'my-api',
  env: 'production',
  version: '1.0.0',
});

// Automatic tracing
tracer.trace('http.request', (span) => {
  span.setTag('http.method', 'GET');
  span.setTag('http.url', '/api/users');
  span.setTag('http.status_code', 200);
  return { users: [] };
});
```

### Python
```python
from elide import require
ddtrace = require('./elide-dd-trace.ts')

# Initialize tracer
tracer = ddtrace.init({
    'service': 'my-api',
    'env': 'production',
})

# Automatic tracing
def handle_request(span):
    span.setTag('http.method', 'GET')
    return {'users': []}

tracer.trace('http.request', handle_request)
```

### Ruby
```ruby
ddtrace = Elide.require('./elide-dd-trace.ts')

# Initialize tracer
tracer = ddtrace.init({
  service: 'my-api',
  env: 'production',
})

# Automatic tracing
tracer.trace('http.request') do |span|
  span.setTag('http.method', 'GET')
  {users: []}
end
```

### Java
```java
Value ddtrace = context.eval("js", "require('./elide-dd-trace.ts')");
Value tracer = ddtrace.invokeMember("init", Map.of("service", "my-api"));

// Automatic tracing
tracer.invokeMember("trace", "http.request", (Consumer<Value>) span -> {
    span.invokeMember("setTag", "http.method", "GET");
});
```

## 💡 Real-World Use Cases

### Distributed Tracing
```typescript
import ddtrace from './elide-dd-trace.ts';

const tracer = ddtrace.init({ service: 'api-gateway' });

// Trace request across multiple services
tracer.trace('api.request', (parentSpan) => {
  parentSpan.setTag('endpoint', '/api/checkout');

  // Auth service
  tracer.trace('auth.verify', (span) => {
    span.setTag('user.id', '12345');
  });

  // Payment service
  tracer.trace('payment.process', (span) => {
    span.setTag('amount', 99.99);
    span.setTag('currency', 'USD');
  });

  // Inventory service
  tracer.trace('inventory.update', (span) => {
    span.setTag('product.id', 'abc-123');
  });
});
```

### Error Tracking
```typescript
tracer.trace('database.query', (span) => {
  span.setTag('db.type', 'postgresql');
  span.setTag('db.statement', 'SELECT * FROM users');

  try {
    // Database operation
    throw new Error('Connection timeout');
  } catch (error) {
    span.setError(error);
    throw error;
  }
});
```

### Performance Monitoring
```typescript
const tracer = ddtrace.init({
  service: 'my-api',
  env: 'production',
  version: '2.1.0',
});

// Monitor performance
tracer.trace('expensive.operation', (span) => {
  span.setTag('operation.type', 'batch-processing');
  span.setTag('batch.size', 1000);

  const startTime = Date.now();
  // Expensive operation
  const duration = Date.now() - startTime;

  span.setTag('duration.ms', duration);
  console.log(`Operation completed in ${duration}ms`);
});
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different APM libraries

```
Node.js: dd-trace, APM agents
Python: ddtrace, different API
Ruby: ddtrace, different setup
Java: dd-java-agent, bytecode instrumentation

Result:
❌ Different trace formats
❌ Inconsistent tagging
❌ Complex trace correlation
❌ Different APIs to learn
```

### The Solution
**After**: One Elide APM library for all languages

```
┌────────────────────────────────┐
│  Elide dd-trace (TypeScript)  │
│  elide-dd-trace.ts            │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One tracing standard
✅ Consistent trace format
✅ Easy trace correlation
✅ Shared configuration
```

## 📖 API Reference

### `init(options?)`
Initialize the global tracer

Options:
- `service`: Service name
- `env`: Environment (e.g., 'production')
- `version`: Service version
- `tags`: Global tags

### `tracer()`
Get the global tracer instance

### Tracer Methods
- `startSpan(name, options?)` - Create a new span
- `trace(name, fn)` - Auto-trace a function
- `trace(name, options, fn)` - Auto-trace with options
- `scope()` - Get current scope

### Span Methods
- `setTag(key, value)` - Add a tag
- `setError(error)` - Mark span as error
- `context()` - Get span context
- `finish(finishTime?)` - Finish the span

## 🧪 Testing

```bash
elide run elide-dd-trace.ts
```

## 📂 Files

- `elide-dd-trace.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm dd-trace package](https://www.npmjs.com/package/dd-trace)
- [Datadog APM](https://www.datadoghq.com/product/apm/)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: Datadog APM and distributed tracing
- **Elide advantage**: One APM library for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One tracer to trace them all.*
