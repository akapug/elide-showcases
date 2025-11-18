# terser-webpack-plugin - Elide Polyglot Showcase

> **JavaScript minification for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- ES6+ support
- Source map generation
- Parallel processing
- **~10M+ downloads/week on npm**

## Quick Start

```typescript
import { minify } from './elide-terser-webpack-plugin.ts';

const minified = minify('function test() { return 42; }', {
  compress: { drop_console: true },
  mangle: true
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/terser-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
