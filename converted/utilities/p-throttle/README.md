# Elide P-Throttle

Pure TypeScript implementation of `p-throttle`.

## Original Package

- **npm**: `p-throttle`
- **Downloads**: ~3M/week

## Usage

```typescript
import pThrottle from './elide-p-throttle.ts';

const throttle = pThrottle({ limit: 2, interval: 1000 });

const throttledFetch = throttle(async (id: number) => {
  return fetchData(id);
});

await Promise.all([
  throttledFetch(1),
  throttledFetch(2),
  throttledFetch(3),
]);
```
