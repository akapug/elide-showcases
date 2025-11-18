# Immutable - Immutable Collections

Immutable persistent data collections on Elide.

## Quick Start

```typescript
import { List, Map } from './elide-immutable.ts';

const list = new List([1, 2, 3]);
const list2 = list.push(4);

const map = new Map([["a", 1]]);
const map2 = map.set("b", 2);
```

Based on https://www.npmjs.com/package/immutable (~2M+ downloads/week)
