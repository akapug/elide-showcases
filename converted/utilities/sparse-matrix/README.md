# sparse-matrix - Elide Polyglot Showcase

> **Sparse matrices for ALL languages** - TypeScript, Python, R, and Julia

## Features

- COO format
- Efficient storage
- Matrix-vector multiplication
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { SparseMatrix } from './elide-sparse-matrix.ts';

const m = new SparseMatrix(100, 100);
m.set(0, 0, 1);
m.mult([1, 2, 3]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/sparse-matrix)

---

**Built with ❤️ for the Elide Polyglot Runtime**
