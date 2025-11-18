# case-sensitive-paths-webpack-plugin - Elide Polyglot Showcase

> **Path validation for ALL build systems**

## Features

- Case-sensitive path checking
- Cross-platform compatibility
- Developer warnings
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import CaseSensitivePathsPlugin from './elide-case-sensitive-paths-webpack-plugin.ts';

const plugin = new CaseSensitivePathsPlugin();
plugin.registerPath('src/App.tsx');
const result = plugin.checkPath('src/app.tsx');
```

## Links

- [Original npm package](https://www.npmjs.com/package/case-sensitive-paths-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
