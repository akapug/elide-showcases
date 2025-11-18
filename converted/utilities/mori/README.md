# Mori - ClojureScript Data Structures

Persistent data structures for JavaScript.

Based on [mori](https://www.npmjs.com/package/mori) (~30K+ downloads/week)

```typescript
import { PersistentVector, PersistentMap } from './elide-mori.ts';

const v1 = PersistentVector.of(1, 2, 3);
const v2 = v1.conj(4); // [1, 2, 3, 4], v1 unchanged

const m1 = PersistentMap.of(['a', 1]);
const m2 = m1.assoc('b', 2); // New map, m1 unchanged
```

Run: `elide run elide-mori.ts`
