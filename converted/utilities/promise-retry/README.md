# Promise Retry - Elide Polyglot Showcase

> **One promise retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Retries promise-based operations with various backoff strategies.

## Features

- Promise retry support
- Multiple backoff strategies
- Error handling
- Configurable attempts
- Retry tracking
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import promiseRetry from './elide-promise-retry.ts';

const result = await promiseRetry(async (retry, attempt) => {
  console.log(`Attempt ${attempt}`);
  
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) {
    retry(new Error('Request failed'));
  }
  
  return response.json();
}, {
  retries: 5,
  minTimeout: 1000
});
```

## Documentation

Run the demo:

```bash
elide run elide-promise-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/promise-retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
