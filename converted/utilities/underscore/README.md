# Underscore - Utility Library

Functional programming helpers for everyday use.

Based on [underscore](https://www.npmjs.com/package/underscore) (~2M+ downloads/week)

```typescript
import _ from './elide-underscore.ts';

_.map([1, 2, 3], x => x * 2); // [2, 4, 6]
_.filter([1, 2, 3, 4], x => x % 2 === 0); // [2, 4]
_.uniq([1, 2, 2, 3]); // [1, 2, 3]
_.pick({ a: 1, b: 2, c: 3 }, ['a', 'b']); // { a: 1, b: 2 }
```

Run: `elide run elide-underscore.ts`
