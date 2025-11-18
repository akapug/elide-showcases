# bundle-buddy - Elide Polyglot Showcase

> **Duplicate analysis for ALL build systems**

## Features

- Duplicate detection
- Code sharing analysis
- Bundle optimization
- **~10K+ downloads/week on npm**

## Quick Start

```typescript
import BundleBuddy from './elide-bundle-buddy.ts';

const buddy = new BundleBuddy();
buddy.addBundle({ name: 'main', modules: ['lodash', 'react'], size: 200000 });
buddy.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/bundle-buddy)

---

**Built with ❤️ for the Elide Polyglot Runtime**
