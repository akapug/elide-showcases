# Rambdax - Extended Rambda

Extended version of Rambda with extra utilities.

Based on [rambdax](https://www.npmjs.com/package/rambdax) (~50K+ downloads/week)

```typescript
import R from './elide-rambdax.ts';

R.map(x => x * 2, [1, 2, 3]); // [2, 4, 6]
R.delay(1000); // Promise<void>
R.debounce(fn, 300); // Debounced function
```

Run: `elide run elide-rambdax.ts`
