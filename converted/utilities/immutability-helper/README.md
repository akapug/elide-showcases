# Immutability Helper - Immutable Updates

Mutate a copy without changing original.

Based on [immutability-helper](https://www.npmjs.com/package/immutability-helper) (~300K+ downloads/week)

```typescript
import update from './elide-immutability-helper.ts';

const state = { count: 0 };
const newState = update(state, { count: { $set: 1 } });
// newState: { count: 1 }, state unchanged
```

Run: `elide run elide-immutability-helper.ts`
