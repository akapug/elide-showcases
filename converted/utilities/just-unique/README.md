# Just Unique - Array Deduplication

Remove duplicates from arrays.

Based on [just-unique](https://www.npmjs.com/package/just-unique) (~20K+ downloads/week)

```typescript
import { unique, uniqueBy } from './elide-just-unique.ts';

unique([1, 2, 2, 3]); // [1, 2, 3]
uniqueBy(users, u => u.id); // Unique by property
```

Run: `elide run elide-just-unique.ts`
