# Retry As Promised - Elide Polyglot Showcase

> **One promise retry library for ALL languages** - TypeScript, Python, Ruby, and Java

Retry promises with configurable backoff strategies.

## Features

- Promise retry support
- Configurable backoff
- Max retry attempts
- Error tracking
- Timeout support
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import retryAsPromised from './elide-retry-as-promised.ts';

const result = await retryAsPromised(async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}, {
  max: 5,
  backoffBase: 100,
  backoffExponent: 1.5,
  report: (message) => console.log(message)
});
```

## Documentation

Run the demo:

```bash
elide run elide-retry-as-promised.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/retry-as-promised)

---

**Built with ❤️ for the Elide Polyglot Runtime**
