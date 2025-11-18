# trace-context - Elide Polyglot Showcase

> **W3C Trace Context for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- W3C Trace Context standard
- Traceparent header parsing
- Tracestate header handling
- Context propagation
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { TraceContextParser } from './elide-trace-context.ts';

const context = TraceContextParser.create({ sampled: true });
const headers = TraceContextParser.serialize(context);
console.log(headers.traceparent);
```

## Links

- [Original npm package](https://www.npmjs.com/package/trace-context)

---

**Built with ❤️ for the Elide Polyglot Runtime**
