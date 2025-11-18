# regression - Elide Polyglot Showcase

> **Regression analysis for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Linear regression
- Polynomial regression
- Exponential, logarithmic, power regression
- R² calculation
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { linear, polynomial } from './elide-regression.ts';

const data = [[1, 2], [2, 4], [3, 6]];
const model = linear(data);
model.predict(4); // 8
console.log("R²:", model.r2);
```

## Links

- [Original npm package](https://www.npmjs.com/package/regression)

---

**Built with ❤️ for the Elide Polyglot Runtime**
