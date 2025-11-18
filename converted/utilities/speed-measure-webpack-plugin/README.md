# speed-measure-webpack-plugin - Elide Polyglot Showcase

> **Build performance measurement for ALL build systems**

## Features

- Measure build time
- Plugin timings
- Performance insights
- **~200K+ downloads/week on npm**

## Quick Start

```typescript
import SpeedMeasurePlugin from './elide-speed-measure-webpack-plugin.ts';

const plugin = new SpeedMeasurePlugin();
plugin.start('build');
// ... build process
plugin.end('build');
plugin.report();
```

## Links

- [Original npm package](https://www.npmjs.com/package/speed-measure-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
