# numeric - Elide Polyglot Showcase

> **Numerical computing for ALL languages** - TypeScript, Python, R, and Java

## Features

- Matrix operations (add, multiply, inverse, determinant)
- Linear system solver
- Vector operations
- Polynomial evaluation and roots
- Numerical optimization (gradient descent, golden section)
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { matrix, vector, optimize } from './elide-numeric.ts';

// Matrix operations
const A = [[1, 2], [3, 4]];
const B = [[5, 6], [7, 8]];
matrix.add(A, B);
matrix.mul(A, B);
matrix.det(A);

// Solve linear system
const x = matrix.solve([[2, 1], [1, 3]], [5, 7]);

// Optimization
const f = (x: number[]) => (x[0] - 3) ** 2;
const grad = (x: number[]) => [2 * (x[0] - 3)];
optimize.gradientDescent(f, grad, [0]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/numeric)

---

**Built with ❤️ for the Elide Polyglot Runtime**
