# P-Memoize - Promise Memoization

Memoize async functions and promises.

Based on [p-memoize](https://www.npmjs.com/package/p-memoize) (~300K+ downloads/week)

## Features

- Async function memoization
- Cache expiry
- Custom cache keys

## Quick Start

```typescript
import pMemoize from './elide-p-memoize.ts';

const fetchUser = pMemoize(async (id: number) => {
  return { id, name: `User${id}` };
});

await fetchUser(1); // API call
await fetchUser(1); // Cached!
```
