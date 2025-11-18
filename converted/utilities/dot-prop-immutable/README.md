# Dot Prop Immutable - Immutable Dot Notation

Immutable get/set/delete using dot notation.

Based on [dot-prop-immutable](https://www.npmjs.com/package/dot-prop-immutable) (~30K+ downloads/week)

```typescript
import dotProp from './elide-dot-prop-immutable.ts';

const obj = { a: { b: { c: 1 } } };

dotProp.get(obj, 'a.b.c'); // 1
dotProp.set(obj, 'a.b.c', 2); // New object with c: 2
dotProp.delete(obj, 'a.b.c'); // New object without c
```

Run: `elide run elide-dot-prop-immutable.ts`
