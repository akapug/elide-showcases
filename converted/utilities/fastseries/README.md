# FastSeries - Fast Series Execution

Zero-overhead series execution.

Based on [fastseries](https://www.npmjs.com/package/fastseries) (~100K+ downloads/week)

```typescript
import FastSeries from './elide-fastseries.ts';

const series = new FastSeries();
series.push((release, n) => release(null, n * 2));
series.run((err, result) => console.log(result));
```

Run: `elide run elide-fastseries.ts`
