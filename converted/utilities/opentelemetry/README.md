# OpenTelemetry - Observability Framework - Elide Polyglot Showcase

> **OpenTelemetry for ALL languages** - TypeScript, Python, Ruby, and Java

A vendor-neutral observability framework with distributed tracing and metrics.

## ✨ Features

- ✅ Distributed tracing
- ✅ Span creation and management
- ✅ Context propagation
- ✅ Attributes and events
- ✅ Vendor-neutral
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { trace } from './elide-opentelemetry.ts';

const tracer = trace.getTracer('my-service');

const span = tracer.startSpan('operation');
span.setAttribute('user.id', '123');
span.addEvent('processing.started');
// ... do work
span.end();
```

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: Distributed tracing
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
