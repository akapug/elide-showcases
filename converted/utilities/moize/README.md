# Moize - Blazing Fast Memoization

Ultra-fast memoization with advanced features and configurations.

Based on [moize](https://www.npmjs.com/package/moize) (~100K+ downloads/week)

## Features

- Multiple caching strategies
- Max age and max size
- Deep equality checking
- Statistics tracking
- Promise memoization
- Zero dependencies

## Quick Start

```typescript
import moize from './elide-moize.ts';

const multiply = moize(
  (a: number, b: number) => a * b,
  { maxSize: 100, maxAge: 5000 }
);

multiply(5, 3); // Computed
multiply(5, 3); // Cached!

console.log(multiply.stats); // { hits: 1, misses: 1 }
```
