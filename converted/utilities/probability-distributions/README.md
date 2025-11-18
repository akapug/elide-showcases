# probability-distributions - Elide Polyglot Showcase

> **Probability distributions for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Normal, uniform, exponential distributions
- Binomial and Poisson distributions
- Random sampling
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { normal, uniform, binomial } from './elide-probability-distributions.ts';

normal.sample(100, 0, 1); // 100 N(0,1) samples
uniform.sample(50, 0, 10); // 50 U(0,10) samples
binomial.sample(20, 10, 0.5); // 20 Binomial(10, 0.5) samples
```

## Links

- [Original npm package](https://www.npmjs.com/package/probability-distributions)

---

**Built with ❤️ for the Elide Polyglot Runtime**
