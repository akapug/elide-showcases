# Timm - Immutability Library

Tiny immutable operations library.

Based on [timm](https://www.npmjs.com/package/timm) (~50K+ downloads/week)

```typescript
import timm from './elide-timm.ts';

const obj = { a: 1 };
timm.set(obj, 'a', 2); // { a: 2 }
timm.merge(obj, { b: 3 }); // { a: 1, b: 3 }
timm.addLast([1, 2], 3); // [1, 2, 3]
```

Run: `elide run elide-timm.ts`
