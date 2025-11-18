# Fetch Retry - Elide Polyglot Showcase

> **One fetch retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Extends fetch with configurable retry and exponential backoff.

## Features

- Fetch with retry
- Exponential backoff
- Configurable retries
- Custom retry logic
- Status code handling
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import fetchRetry from './elide-fetch-retry.ts';

const response = await fetchRetry('https://api.example.com/data', {
  retries: 5,
  retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
  retryOn: [408, 429, 500, 502, 503, 504]
});

const data = await response.json();
```

## Documentation

Run the demo:

```bash
elide run elide-fetch-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/fetch-retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
