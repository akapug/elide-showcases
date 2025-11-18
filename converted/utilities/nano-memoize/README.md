# Nano-Memoize - Tiny Fast Memoization

Ultra-small memoization with multi-arg support.

Based on [nano-memoize](https://www.npmjs.com/package/nano-memoize) (~50K+ downloads/week)

## Quick Start

```typescript
import nanoMemoize from './elide-nano-memoize.ts';

const add = nanoMemoize((a: number, b: number) => a + b);
console.log(add(2, 3)); // 5
```
