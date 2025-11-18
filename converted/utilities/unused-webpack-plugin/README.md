# unused-webpack-plugin - Elide Polyglot Showcase

> **Unused file detection for ALL projects**

## Features

- Detect unused files
- Pattern matching
- Clean reports
- **~50K+ downloads/week on npm**

## Quick Start

```typescript
import UnusedWebpackPlugin from './elide-unused-webpack-plugin.ts';

const plugin = new UnusedWebpackPlugin();
plugin.addFile('src/file.ts');
plugin.markAsUsed('src/file.ts');
plugin.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/unused-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
