# lightstep-tracer - Elide Polyglot Showcase

> **Distributed tracing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Distributed tracing
- OpenTracing compatible
- Custom spans and tags
- Trace context propagation
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { Tracer } from './elide-lightstep-tracer.ts';

const tracer = new Tracer({
  access_token: 'your-token',
  component_name: 'my-service',
});

const span = tracer.startSpan('operation');
span.setTag('key', 'value');
span.finish();
```

## Links

- [Original npm package](https://www.npmjs.com/package/lightstep-tracer)

---

**Built with ❤️ for the Elide Polyglot Runtime**
