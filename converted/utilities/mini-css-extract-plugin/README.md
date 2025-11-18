# mini-css-extract-plugin - Elide Polyglot Showcase

> **CSS extraction for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- Separate CSS files
- CSS code splitting
- Source maps
- **~5M+ downloads/week on npm**

## Quick Start

```typescript
import MiniCssExtractPlugin from './elide-mini-css-extract-plugin.ts';

const plugin = new MiniCssExtractPlugin({
  filename: '[name].css'
});

plugin.extractCSS('styles.css', '.container { width: 100%; }');
const css = plugin.generateCSSFile('bundle');
```

## Links

- [Original npm package](https://www.npmjs.com/package/mini-css-extract-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
