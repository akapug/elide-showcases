# Fast-Memoize - Fastest Memoization

The fastest possible memoization library in pure JavaScript.

Based on [fast-memoize](https://www.npmjs.com/package/fast-memoize) (~300K+ downloads/week)

## Features

- Extremely fast (optimized for V8)
- Single cache or multi-argument
- Custom serializer support
- Zero dependencies

## Quick Start

```typescript
import fastMemoize from './elide-fast-memoize.ts';

const fibonacci = fastMemoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

fibonacci(40); // Fast!
```
