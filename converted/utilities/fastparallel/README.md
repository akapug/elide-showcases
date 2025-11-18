# FastParallel - Fast Parallel Execution

Zero-overhead parallel execution.

Based on [fastparallel](https://www.npmjs.com/package/fastparallel) (~100K+ downloads/week)

```typescript
import FastParallel from './elide-fastparallel.ts';

const parallel = new FastParallel();
parallel.push(release => release(null, 1));
parallel.run((err, results) => console.log(results));
```

Run: `elide run elide-fastparallel.ts`
