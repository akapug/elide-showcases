# Elide P-Reduce

Pure TypeScript implementation of `p-reduce` for reducing with promises.

## Features

- Reduce array using async functions
- Serial execution
- Full TypeScript support

## Original Package

- **npm**: `p-reduce`
- **Downloads**: ~8M/week
- **Use case**: Async reduce

## Usage

```typescript
import pReduce from './elide-p-reduce.ts';

const total = await pReduce(
  [1, 2, 3, 4, 5],
  async (sum, value) => sum + await fetchMultiplier(value),
  0
);
```
