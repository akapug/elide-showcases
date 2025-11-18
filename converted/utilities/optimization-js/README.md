# optimization-js - Elide Polyglot Showcase

> **Optimization algorithms for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Gradient descent
- Gradient-free optimization
- **~5K downloads/week on npm**

## Quick Start

```typescript
import { gradientDescent, minimize } from './elide-optimization-js.ts';

const f = ([x]) => (x - 3) ** 2;
const grad = ([x]) => [2 * (x - 3)];
gradientDescent(f, grad, [0]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/optimization-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
