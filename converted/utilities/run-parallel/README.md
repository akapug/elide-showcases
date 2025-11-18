# Run Parallel - Parallel Task Execution

Run async tasks in parallel.

Based on [run-parallel](https://www.npmjs.com/package/run-parallel) (~2M+ downloads/week)

```typescript
import parallel from './elide-run-parallel.ts';

const tasks = [
  cb => setTimeout(() => cb(null, 1), 100),
  cb => setTimeout(() => cb(null, 2), 50),
];

parallel(tasks, (err, results) => {
  console.log(results); // [1, 2]
});
```

Run: `elide run elide-run-parallel.ts`
