# Rambda - Lighter Ramda Alternative

Faster, smaller alternative to Ramda.

Based on [rambda](https://www.npmjs.com/package/rambda) (~200K+ downloads/week)

```typescript
import R from './elide-rambda.ts';

R.map(x => x * 2, [1, 2, 3]); // [2, 4, 6]
R.uniq([1, 2, 2, 3]); // [1, 2, 3]
```

Run: `elide run elide-rambda.ts`
