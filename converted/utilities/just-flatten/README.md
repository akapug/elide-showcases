# Just Flatten - Array Flattening

Flatten nested arrays with configurable depth.

Based on [just-flatten](https://www.npmjs.com/package/just-flatten) (~20K+ downloads/week)

## Quick Start

```typescript
import { flatten, flattenDeep } from './elide-just-flatten.ts';

const nested = [1, [2, [3, [4]]]];
flatten(nested, 1); // [1, 2, [3, [4]]]
flattenDeep(nested); // [1, 2, 3, 4]
```

Run: `elide run elide-just-flatten.ts`
