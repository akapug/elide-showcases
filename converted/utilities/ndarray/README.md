# ndarray - Elide Polyglot Showcase

> **Multidimensional arrays for ALL languages** - TypeScript, Python, Julia, and R

## Features

- N-dimensional array abstraction
- Efficient stride-based indexing
- Slicing and views (no data copying)
- Reshape and transpose operations
- Compatible with NumPy-style operations
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { zeros, ones, array, arange } from './elide-ndarray.ts';

// Create arrays
const a = zeros(3, 4);
const b = ones(2, 3);
const c = array([[1, 2, 3], [4, 5, 6]]);

// Indexing
c.get(0, 1); // 2
c.set(0, 1, 10);

// Slicing
const row = c.slice(1, [0, 3]);

// Reshape and transpose
const d = arange(12).reshape(3, 4);
const e = d.transpose();
```

## Links

- [Original npm package](https://www.npmjs.com/package/ndarray)

---

**Built with ❤️ for the Elide Polyglot Runtime**
