# Collect.js - Collections

Convenient wrapper for arrays and objects.

Based on [collect.js](https://www.npmjs.com/package/collect.js) (~50K+ downloads/week)

```typescript
import Collection from './elide-collect.js.ts';

Collection.make([1, 2, 3])
  .map(x => x * 2)
  .filter(x => x > 3)
  .all(); // [4, 6]
```

Run: `elide run elide-collect.js.ts`
