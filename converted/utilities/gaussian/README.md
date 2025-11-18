# gaussian - Elide Polyglot Showcase

> **Gaussian distribution for ALL languages** - TypeScript, Python, R, and Julia

## Features

- PDF and CDF calculations
- Inverse CDF (PPF)
- Random sampling
- Distribution operations (add, multiply, scale)
- **~20K downloads/week on npm**

## Quick Start

```typescript
import Gaussian from './elide-gaussian.ts';

const dist = new Gaussian(0, 1);
dist.pdf(0); // 0.3989
dist.cdf(1.96); // 0.975
dist.ppf(0.95); // 1.645
dist.random(); // Random sample
```

## Links

- [Original npm package](https://www.npmjs.com/package/gaussian)

---

**Built with ❤️ for the Elide Polyglot Runtime**
