# Re-reselect - Enhanced Reselect

Enhanced Reselect with keyed memoization for multiple cache instances.

Based on [re-reselect](https://www.npmjs.com/package/re-reselect) (~100K+ downloads/week)

## Quick Start

```typescript
import createCachedSelector from './elide-re-reselect.ts';

const getUserById = createCachedSelector(
  (state: any, userId: number) => state.users[userId],
  (user) => user.name,
  (state, userId) => `user-${userId}` // Key selector
);
```
