# html-webpack-plugin - Elide Polyglot Showcase

> **HTML generation for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- Auto-inject script tags
- Template support
- Minification
- **~5M+ downloads/week on npm**

## Quick Start

```typescript
import HtmlWebpackPlugin from './elide-html-webpack-plugin.ts';

const plugin = new HtmlWebpackPlugin({
  title: 'My App',
  minify: true
});

const html = plugin.generateHTML(['bundle.js', 'styles.css']);
```

## Links

- [Original npm package](https://www.npmjs.com/package/html-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
