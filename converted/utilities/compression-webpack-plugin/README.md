# compression-webpack-plugin - Elide Polyglot Showcase

> **Asset compression for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- Gzip and Brotli compression
- Configurable compression levels
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import CompressionWebpackPlugin from './elide-compression-webpack-plugin.ts';

const plugin = new CompressionWebpackPlugin({
  algorithm: 'gzip',
  test: /\.(js|css)$/,
  threshold: 10240,
});

// Or compress directly
import { compressString } from './elide-compression-webpack-plugin.ts';
const compressed = await compressString('your data here', 'gzip');
```

## Links

- [Original npm package](https://www.npmjs.com/package/compression-webpack-plugin)

---

**Built with ❤️ for the Elide Polyglot Runtime**
