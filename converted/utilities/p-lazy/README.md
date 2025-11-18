# Elide P-Lazy

Pure TypeScript implementation of `p-lazy`.

## Original Package

- **npm**: `p-lazy`
- **Downloads**: ~2M/week

## Usage

```typescript
import PLazy from './elide-p-lazy.ts';

const lazyPromise = new PLazy((resolve) => {
  console.log('Executed!');
  resolve(fetchData());
});

// Not executed yet
await lazyPromise; // Now executed
```
