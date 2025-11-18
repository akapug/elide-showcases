# Immer - Immutable State Management

Create the next immutable state by mutating the current one on Elide.

## Quick Start

```typescript
import produce from './elide-immer.ts';

const nextState = produce(currentState, draft => {
  draft.count++;
});
```

Based on https://www.npmjs.com/package/immer (~3M+ downloads/week)
