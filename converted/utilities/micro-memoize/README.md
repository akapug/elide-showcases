# Micro-Memoize - Micro-sized Memoization

Tiny, fast, customizable memoization.

Based on [micro-memoize](https://www.npmjs.com/package/micro-memoize) (~100K+ downloads/week)

## Quick Start

```typescript
import microMemoize from './elide-micro-memoize.ts';

const square = microMemoize((n: number) => n * n);
console.log(square(5)); // 25
```
