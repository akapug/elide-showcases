# Superagent retry - Elide Polyglot Showcase

> **One retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Add retry logic to HTTP clients with exponential backoff.

## Features

- HTTP retry support
- Exponential backoff
- Configurable retries
- Error handling
- Status code filtering
- Zero dependencies

## Quick Start

```typescript
import { RetryInterceptor, exponentialDelay } from './elide-superagent-retry.ts';

const retry = new RetryInterceptor({
  retries: 5,
  retryDelay: exponentialDelay,
  retryCondition: (error) => error.response?.status >= 500
});

const result = await retry.retry(async () => {
  return await httpClient.get('/api/data');
});
```

## Documentation

Run the demo:

```bash
elide run elide-superagent-retry.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/superagent-retry)

---

**Built with ❤️ for the Elide Polyglot Runtime**
