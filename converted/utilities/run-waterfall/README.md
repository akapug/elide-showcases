# Run Waterfall - Waterfall Task Execution

Run tasks in series, passing results to next.

Based on [run-waterfall](https://www.npmjs.com/package/run-waterfall) (~100K+ downloads/week)

```typescript
import waterfall from './elide-run-waterfall.ts';

const tasks = [
  cb => cb(null, 5),
  (cb, n) => cb(null, n * 2),
  (cb, n) => cb(null, n + 3),
];

waterfall(tasks, (err, result) => {
  console.log(result); // 13 (5 * 2 + 3)
});
```

Run: `elide run elide-run-waterfall.ts`
