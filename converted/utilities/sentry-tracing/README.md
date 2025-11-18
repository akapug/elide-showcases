# @sentry/tracing - Elide Polyglot Showcase

> **Performance tracing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Distributed tracing
- Performance monitoring
- Transaction tracking
- Custom spans
- **~800K downloads/week on npm**

## Quick Start

```typescript
import tracing from './elide-sentry-tracing.ts';

const transaction = tracing.startTransaction({
  name: 'GET /api/users',
  op: 'http.server',
});

const span = tracing.startSpan({
  description: 'Database query',
  op: 'db.query',
});

tracing.finishSpan(span);
tracing.finishTransaction(transaction);
```

## Links

- [Original npm package](https://www.npmjs.com/package/@sentry/tracing)

---

**Built with ❤️ for the Elide Polyglot Runtime**
