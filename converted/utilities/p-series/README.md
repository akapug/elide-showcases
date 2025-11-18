# Elide P-Series

Pure TypeScript implementation of `p-series` for running functions in series.

## Original Package

- **npm**: `p-series`
- **Downloads**: ~5M/week

## Usage

```typescript
import pSeries from './elide-p-series.ts';

const results = await pSeries([
  () => fetchData(1),
  () => fetchData(2),
  () => fetchData(3),
]);
```
