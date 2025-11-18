# Elide P-Whilst

Pure TypeScript implementation of `p-whilst` for while loops.

## Original Package

- **npm**: `p-whilst`
- **Downloads**: ~2M/week

## Usage

```typescript
import pWhilst from './elide-p-whilst.ts';

let count = 0;
await pWhilst(
  () => count < 5,
  async () => {
    await doSomething();
    count++;
  }
);
```
