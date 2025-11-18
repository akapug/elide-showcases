# Just Compare - Deep Comparison

Deep equality comparison for objects and arrays.

Based on [just-compare](https://www.npmjs.com/package/just-compare) (~20K+ downloads/week)

```typescript
import compare from './elide-just-compare.ts';

compare({ a: 1 }, { a: 1 }); // true
compare([1, 2], [1, 2]); // true
```

Run: `elide run elide-just-compare.ts`
