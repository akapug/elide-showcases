# ndarray-ops - Elide Polyglot Showcase

> **Array operations for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Element-wise arithmetic (add, sub, mul, div)
- Unary operations (abs, sqrt, exp, log)
- Reductions (sum, min, max)
- Scalar operations
- **~50K downloads/week on npm**

## Quick Start

```typescript
import * as ops from './elide-ndarray-ops.ts';

const a = { data: [1, 2, 3] };
const b = { data: [4, 5, 6] };
const result = { data: [0, 0, 0] };

ops.add(result, a, b); // [5, 7, 9]
ops.mul(result, a, b); // [4, 10, 18]
ops.sum(a); // 6
```

## Links

- [Original npm package](https://www.npmjs.com/package/ndarray-ops)

---

**Built with ❤️ for the Elide Polyglot Runtime**
