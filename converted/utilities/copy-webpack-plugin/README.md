# copy-webpack-plugin - Elide Polyglot Showcase

> **File copying for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- Copy files and directories
- Pattern matching
- Filtering
- **~5M+ downloads/week on npm**

## Quick Start

```typescript
import CopyWebpackPlugin from './elide-copy-webpack-plugin.ts';

const plugin = new CopyWebpackPlugin({
  patterns: [
    { from: 'public', to: 'dist' }
  ]
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/copy-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
