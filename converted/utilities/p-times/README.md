# Elide P-Times

Pure TypeScript implementation of `p-times`.

## Original Package

- **npm**: `p-times`
- **Downloads**: ~5M/week

## Usage

```typescript
import pTimes from './elide-p-times.ts';

const results = await pTimes(5, async (i) => {
  return fetchData(i);
}, { concurrency: 2 });
```
