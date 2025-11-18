# Async-Hook-JL - Async Hook Utilities

Utilities for working with async hooks.

Based on [async-hook-jl](https://www.npmjs.com/package/async-hook-jl) (~50K+ downloads/week)

## Features

- Async context tracking
- Hook lifecycle
- Context preservation
- Performance monitoring

## Quick Start

```typescript
import createHook from './elide-async-hook-jl.ts';

const hook = createHook({
  init: (asyncId, type) => console.log('Init:', type),
  before: (asyncId) => console.log('Before:', asyncId),
  after: (asyncId) => console.log('After:', asyncId)
});

hook.enable();
```
