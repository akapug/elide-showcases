# Underscore.Memoize - Underscore Memoization

Hash-based memoization from Underscore.

Based on Underscore.js (~100K+ downloads/week)

## Quick Start

```typescript
import memoize from './elide-underscore.memoize.ts';

const fibonacci = memoize((n: number): number => {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});
```
