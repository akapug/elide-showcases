# Memoizerific - LRU Memoization

Memoization with max size and LRU eviction.

Based on [memoizerific](https://www.npmjs.com/package/memoizerific) (~50K+ downloads/week)

## Quick Start

```typescript
import memoizerific from './elide-memoizerific.ts';

const memoize = memoizerific(100); // Max 100 items
const add = memoize((a: number, b: number) => a + b);
```
