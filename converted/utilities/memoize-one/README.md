# Memoize-One - Single Result Memoization

Lightweight memoization that only remembers the latest invocation.

Based on [memoize-one](https://www.npmjs.com/package/memoize-one) (~2M+ downloads/week)

## Features

- Memoizes only the last result
- Custom equality functions
- Perfect for React components
- Tiny footprint
- Zero dependencies

## Quick Start

```typescript
import memoizeOne from './elide-memoize-one.ts';

const add = memoizeOne((a: number, b: number) => a + b);

add(1, 2); // Computed
add(1, 2); // Cached!
add(2, 3); // Computed (previous cache cleared)
```

## Use Cases

- React component props
- Event handlers
- Selector functions
- Any function where only the last call matters
