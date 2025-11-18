# correlation-id - Elide Polyglot Showcase

> **Correlation ID tracking for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic correlation ID generation
- Header propagation
- Async context tracking
- Custom ID format
- **~30K downloads/week on npm**

## Quick Start

```typescript
import { CorrelationId } from './elide-correlation-id.ts';

const middleware = CorrelationId.middleware();
app.use(middleware);

CorrelationId.setId('my-id');
const id = CorrelationId.getId();
```

## Links

- [Original npm package](https://www.npmjs.com/package/correlation-id)

---

**Built with ❤️ for the Elide Polyglot Runtime**
