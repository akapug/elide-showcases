# opentracing - Elide Polyglot Showcase

> **OpenTracing API for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- OpenTracing specification
- Vendor-neutral API
- Span management
- Context propagation
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { Tracer, FORMAT_HTTP_HEADERS } from './elide-opentracing.ts';

const tracer = new Tracer();
const span = tracer.startSpan('operation');

span.setTag('key', 'value');
span.finish();
```

## Links

- [Original npm package](https://www.npmjs.com/package/opentracing)

---

**Built with ❤️ for the Elide Polyglot Runtime**
