# Lodash.Memoize - Lodash Memoization

Memoization with resolver function from Lodash.

Based on [lodash.memoize](https://www.npmjs.com/package/lodash.memoize) (~500K+ downloads/week)

## Quick Start

```typescript
import memoize from './elide-lodash.memoize.ts';

const getValue = memoize(
  (obj: any) => obj.value,
  (obj) => obj.id // Resolver
);
```
