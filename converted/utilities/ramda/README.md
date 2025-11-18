# Ramda - Functional Programming Library

Practical functional library emphasizing immutability.

Based on [ramda](https://www.npmjs.com/package/ramda) (~1M+ downloads/week)

```typescript
import R from './elide-ramda.ts';

const double = R.map((x: number) => x * 2);
double([1, 2, 3]); // [2, 4, 6]

const getName = R.prop('name');
getName({ name: "Alice" }); // "Alice"
```

Run: `elide run elide-ramda.ts`
