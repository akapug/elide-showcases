# webpack-visualizer-plugin - Elide Polyglot Showcase

> **Bundle visualization for ALL build systems**

## Features

- Bundle composition charts
- Module size analysis
- HTML reports
- **~30K+ downloads/week on npm**

## Quick Start

```typescript
import WebpackVisualizerPlugin from './elide-webpack-visualizer-plugin.ts';

const plugin = new WebpackVisualizerPlugin();
plugin.addModule({ name: 'lodash', size: 70000 });
const html = plugin.generateHTML();
```

## Links

- [Original npm package](https://www.npmjs.com/package/webpack-visualizer-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
