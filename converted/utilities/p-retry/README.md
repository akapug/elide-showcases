# P-Retry - Elide Polyglot Showcase

> **One promise retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Retry a promise-returning or async function with exponential backoff.

## Features

- Exponential backoff
- Retry promises
- Abort retries
- Custom retry logic
- Timeout support
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import pRetry, { AbortError } from './elide-p-retry.ts';

const result = await pRetry(async (attemptCount) => {
  const response = await fetch('https://api.example.com/data');
  
  if (response.status === 404) {
    throw new AbortError('Not found'); // Don't retry 404s
  }
  
  if (!response.ok) {
    throw new Error('Request failed');
  }
  
  return response.json();
}, {
  retries: 5,
  onFailedAttempt: (error) => {
    console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
  }
});
```

## Documentation

Run the demo:

```bash
elide run elide-p-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/p-retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
