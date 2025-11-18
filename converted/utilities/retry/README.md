# Retry - Elide Polyglot Showcase

> **One retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Abstraction for exponential and custom retry strategies for failed operations.

## Features

- Exponential backoff
- Custom retry strategies
- Configurable timeouts
- Max attempts
- Random jitter
- Zero dependencies
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { operation, retry } from './elide-retry.ts';

// Create retry operation
const op = operation({
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 60000
});

// Attempt operation with retry
await op.attempt(async (bail) => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) throw new Error('Request failed');
  return response.json();
});
```

## Documentation

Run the demo:

```bash
elide run elide-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
