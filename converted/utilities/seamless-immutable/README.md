# Seamless Immutable - Immutable Data

Immutable data structures for JavaScript.

Based on [seamless-immutable](https://www.npmjs.com/package/seamless-immutable) (~100K+ downloads/week)

```typescript
import Immutable from './elide-seamless-immutable.ts';

const obj = Immutable({ a: 1 });
// obj.a = 2; // Error: Cannot mutate
const updated = Immutable.set(obj, 'a', 2);
```

Run: `elide run elide-seamless-immutable.ts`
