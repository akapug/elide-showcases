# Run Series - Series Task Execution

Run async tasks in series (sequential).

Based on [run-series](https://www.npmjs.com/package/run-series) (~500K+ downloads/week)

```typescript
import series from './elide-run-series.ts';

const tasks = [
  cb => setTimeout(() => cb(null, 1), 100),
  cb => setTimeout(() => cb(null, 2), 50),
];

series(tasks, (err, results) => {
  console.log(results); // [1, 2] (in order)
});
```

Run: `elide run elide-run-series.ts`
