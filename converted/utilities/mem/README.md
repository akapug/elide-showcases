# Mem - Memoization Made Simple

Super fast memoization with cache expiration, max size, and custom equality.

Based on [mem](https://www.npmjs.com/package/mem) (~500K+ downloads/week)

## Features

- Cache function results
- TTL/expiration support
- Max cache size with LRU eviction
- Custom cache key functions
- Promise/async support
- Clear cache programmatically
- Zero dependencies

## Quick Start

```typescript
import mem from './elide-mem.ts';

// Basic memoization
const fibonacci = mem((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(10)); // Computed
console.log(fibonacci(10)); // Cached!

// With options
const fetchData = mem(
  (id: number) => ({ id, data: `Data-${id}` }),
  { 
    maxAge: 5000,      // Expire after 5 seconds
    cacheSize: 100     // Max 100 cached items
  }
);
```

## Polyglot Benefits

This memoization library works across ALL languages on Elide:
- JavaScript/TypeScript
- Python (via Elide)
- Ruby (via Elide)
- Java (via Elide)

One memoization solution for your entire polyglot stack!
