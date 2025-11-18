# bundlesize - Elide Polyglot Showcase

> **Size budgets for ALL build systems**

## Features

- Size budgets
- CI integration
- Pass/fail reporting
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import Bundlesize from './elide-bundlesize.ts';

const bundlesize = new Bundlesize([
  { path: 'dist/main.js', maxSize: '150KB' }
]);

bundlesize.check('dist/main.js', 140 * 1024);
bundlesize.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/bundlesize)

---

**Built with ❤️ for the Elide Polyglot Runtime**
