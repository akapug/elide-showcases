# Async for Elide

Utility module for working with asynchronous JavaScript.

**Downloads**: ~12M/week on npm

## Quick Start

```typescript
import { series, parallel, retry } from './async.ts';

// Run tasks in series
const results = await series([
  async () => fetchData1(),
  async () => fetchData2()
]);

// Run tasks in parallel
const all = await parallel([
  async () => fetchData1(),
  async () => fetchData2()
]);

// Retry failed operations
const data = await retry(() => fetchData(), 3);
```

## Resources

- Original: https://www.npmjs.com/package/async
