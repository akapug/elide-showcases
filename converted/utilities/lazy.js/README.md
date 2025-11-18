# Lazy.js - Lazy Evaluation

Lazy evaluation library for JavaScript.

Based on [lazy.js](https://www.npmjs.com/package/lazy.js) (~100K+ downloads/week)

```typescript
import Lazy from './elide-lazy.js.ts';

Lazy.from([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .filter(x => x > 5)
  .take(2)
  .toArray(); // [6, 8]
```

Run: `elide run elide-lazy.js.ts`
