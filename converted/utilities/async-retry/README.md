# Async Retry - Elide Polyglot Showcase

> **One async retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Retry async functions with exponential backoff and full error recovery.

## Features

- Exponential backoff
- Retry failed async operations
- Configurable retry attempts
- Custom retry strategies
- Error tracking
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import asyncRetry from './elide-async-retry.ts';

const result = await asyncRetry(async (bail, attempt) => {
  console.log(`Attempt ${attempt}`);
  const response = await fetch('https://api.example.com/data');
  
  if (!response.ok) {
    if (response.status === 404) {
      bail(new Error('Not found')); // Don't retry 404s
      return;
    }
    throw new Error('Request failed');
  }
  
  return response.json();
}, {
  retries: 5,
  minTimeout: 1000,
  maxTimeout: 60000,
  onRetry: (err, attempt) => console.log(`Retry ${attempt}: ${err.message}`)
});
```

## Documentation

Run the demo:

```bash
elide run elide-async-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/async-retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
