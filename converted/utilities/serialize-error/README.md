# serialize-error - Elide Polyglot Showcase

> **Serialize/deserialize errors to JSON for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Serialize Error objects to JSON
- Preserve stack traces
- Handle circular references
- **~40M downloads/week on npm**

## Quick Start

```typescript
import { serializeError, deserializeError } from './elide-serialize-error.ts';

const error = new Error('Connection failed');
error.code = 'ECONNREFUSED';

const json = serializeError(error);
const restored = deserializeError(json);

console.log(restored.message);
```

## Links

- [Original npm package](https://www.npmjs.com/package/serialize-error)

---

**Built with ❤️ for the Elide Polyglot Runtime**
