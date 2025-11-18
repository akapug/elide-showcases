# simple-statistics - Elide Polyglot Showcase

> **Statistical methods for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Descriptive statistics (mean, median, mode, variance)
- Quantiles and percentiles
- Linear regression
- Correlation analysis
- R-squared calculation
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { mean, median, linearRegression, rSquared } from './elide-simple-statistics.ts';

const data = [1, 2, 3, 4, 5];
mean(data); // 3
median(data); // 3

const x = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10];
const model = linearRegression(x, y);
rSquared(x, y, model);
```

## Links

- [Original npm package](https://www.npmjs.com/package/simple-statistics)

---

**Built with ❤️ for the Elide Polyglot Runtime**
