# Neo-Async - Async Utilities

Fast async control flow library.

Based on [neo-async](https://www.npmjs.com/package/neo-async) (~500K+ downloads/week)

```typescript
import async from './elide-neo-async.ts';

async.parallel([
  cb => setTimeout(() => cb(null, 1), 100),
  cb => setTimeout(() => cb(null, 2), 50),
], (err, results) => console.log(results));
```

Run: `elide run elide-neo-async.ts`
