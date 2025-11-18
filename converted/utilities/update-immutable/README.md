# Update Immutable - Immutable Updates

Simple immutable update helper.

Based on [update-immutable](https://www.npmjs.com/package/update-immutable) (~10K+ downloads/week)

```typescript
import update from './elide-update-immutable.ts';

const obj = { a: { b: 1 } };
update(obj, 'a.b', 2); // { a: { b: 2 } }
update(obj, ['a', 'b'], 2); // Same
```

Run: `elide run elide-update-immutable.ts`
