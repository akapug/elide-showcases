# size-plugin - Elide Polyglot Showcase

> **Bundle size tracking for ALL build systems**

## Features

- Track bundle sizes
- Size comparisons
- CI-friendly
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import SizePlugin from './elide-size-plugin.ts';

const plugin = new SizePlugin();
plugin.addBundle({ name: 'main.js', size: 125000, gzip: 45000 });
plugin.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/size-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
