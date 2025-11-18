# newton-raphson - Elide Polyglot Showcase

> **Newton's method for ALL languages** - TypeScript, Python, R, and Julia

## Features

- Newton-Raphson iteration
- Convergence control
- **~5K downloads/week on npm**

## Quick Start

```typescript
import newtonRaphson from './elide-newton-raphson.ts';

const f = (x) => x * x - 4;
const df = (x) => 2 * x;
newtonRaphson(f, df, 1); // 2
```

## Links

- [Original npm package](https://www.npmjs.com/package/newton-raphson)

---

**Built with ❤️ for the Elide Polyglot Runtime**
