# Elide P-Waterfall

Pure TypeScript implementation of `p-waterfall`.

## Original Package

- **npm**: `p-waterfall`
- **Downloads**: ~2M/week

## Usage

```typescript
import pWaterfall from './elide-p-waterfall.ts';

const result = await pWaterfall([
  () => fetchData(),
  (data) => processData(data),
  (processed) => saveData(processed),
]);
```
