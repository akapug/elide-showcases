# Reselect - Redux Selector Memoization

Composable selectors with automatic memoization for Redux.

Based on [reselect](https://www.npmjs.com/package/reselect) (~2M+ downloads/week)

## Features

- Composable selectors
- Automatic memoization
- Optimized for Redux

## Quick Start

```typescript
import { createSelector } from './elide-reselect.ts';

const getItems = (state: any) => state.items;
const getTotalPrice = createSelector(
  getItems,
  (items: any[]) => items.reduce((sum, item) => sum + item.price, 0)
);

const state = { items: [{ price: 10 }, { price: 20 }] };
console.log(getTotalPrice(state)); // 30
```
