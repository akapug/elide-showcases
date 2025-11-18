# Elide P-Settle

Pure TypeScript implementation of `p-settle` for settling all promises.

## Features

- Settle all promises regardless of rejection
- Inspection of each result
- Zero dependencies
- Full TypeScript support

## Original Package

- **npm**: `p-settle`
- **Downloads**: ~8M/week
- **Use case**: Promise.allSettled wrapper

## Usage

```typescript
import pSettle from './elide-p-settle.ts';

const results = await pSettle([
  Promise.resolve(1),
  Promise.reject(new Error('failed')),
  Promise.resolve(3),
]);

results.forEach(result => {
  if (result.isFulfilled) {
    console.log('Success:', result.value);
  } else {
    console.log('Error:', result.reason);
  }
});
```
