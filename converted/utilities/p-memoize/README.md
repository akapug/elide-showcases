# Elide P-Memoize

Pure TypeScript implementation of `p-memoize`.

## Original Package

- **npm**: `p-memoize`
- **Downloads**: ~5M/week

## Usage

```typescript
import pMemoize from './elide-p-memoize.ts';

const memoizedFetch = pMemoize(async (id: number) => {
  return fetchData(id);
}, { maxAge: 60000 });

await memoizedFetch(1); // Fetches
await memoizedFetch(1); // From cache
```
