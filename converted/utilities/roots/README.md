# roots - Elide Polyglot Showcase

> **Root finding for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Bisection method
- Newton's method
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { bisection, newton } from './elide-roots.ts';

const f = (x) => x * x - 2;
const df = (x) => 2 * x;
bisection(f, 0, 2); // ~1.414
newton(f, df, 1); // ~1.414
```

## Links

- [Original npm package](https://www.npmjs.com/package/roots)

---

**Built with ❤️ for the Elide Polyglot Runtime**
