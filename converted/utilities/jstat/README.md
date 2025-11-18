# jstat - Elide Polyglot Showcase

> **Statistical library for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Descriptive statistics (mean, median, variance, std)
- Probability distributions (normal, t, chi-square)
- Statistical tests (t-test, two-sample t-test)
- Correlation and covariance
- **~50K downloads/week on npm**

## Quick Start

```typescript
import { stats, normal, test } from './elide-jstat.ts';

// Descriptive stats
const data = [2, 4, 6, 8, 10];
stats.mean(data);
stats.std(data);

// Normal distribution
normal.pdf(0, 0, 1);
normal.cdf(1.96);

// t-test
test.ttest(data, 5);
```

## Links

- [Original npm package](https://www.npmjs.com/package/jstat)

---

**Built with ❤️ for the Elide Polyglot Runtime**
