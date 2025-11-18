# Elide P-Each-Series

Pure TypeScript implementation of `p-each-series` for serial iteration.

## Features

- Iterate over array items serially
- Async/await support
- Full TypeScript support

## Original Package

- **npm**: `p-each-series`
- **Downloads**: ~8M/week
- **Use case**: Serial async iteration

## Usage

```typescript
import pEachSeries from './elide-p-each-series.ts';

await pEachSeries([1, 2, 3], async (item) => {
  await processItem(item);
});
```
