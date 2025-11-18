# curve-fit - Elide Polyglot Showcase

> **Curve fitting for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Non-linear least squares
- Custom function fitting
- **~5K downloads/week on npm**

## Quick Start

```typescript
import { fit } from './elide-curve-fit.ts';

const xData = [1, 2, 3];
const yData = [2, 4, 6];
const func = (x, [a, b]) => a * x + b;
const params = fit(xData, yData, func, [1, 0]);
```

## Links

- [Original npm package](https://www.npmjs.com/package/curve-fit)

---

**Built with ❤️ for the Elide Polyglot Runtime**
