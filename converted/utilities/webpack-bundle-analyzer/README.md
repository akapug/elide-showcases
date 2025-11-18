# Bundle Size Analyzer - Elide Polyglot Showcase

> **One webpack-bundle-analyzer implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Bundle Size Analyzer with a single implementation that works across your entire polyglot stack.

## ✨ Features

- ✅ Module bundling and optimization
- ✅ Build tool integration
- ✅ Development workflow automation
- ✅ Production deployment preparation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { build, createWebpackBundleAnalyzer } from './elide-webpack-bundle-analyzer.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createWebpackBundleAnalyzer({
  input: 'src/index.ts',
  output: 'dist/bundle.min.js',
  minify: true,
  sourcemap: true,
});
await builder.build();
```

### Python
```python
from elide import require
webpack_bundle_analyzer = require('./elide-webpack-bundle-analyzer.ts')

# Build
webpack_bundle_analyzer.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
webpack_bundle_analyzer = Elide.require('./elide-webpack-bundle-analyzer.ts')

# Build
webpack_bundle_analyzer.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value webpackBundleAnalyzer = context.eval("js", "require('./elide-webpack-bundle-analyzer.ts')");

// Build
webpackBundleAnalyzer.invokeMember("build");
```

## 🎯 Why Polyglot?

**Before**: Each language has different build tools

**After**: One Elide implementation for all languages

Benefits:
- ✅ One build tool, all languages
- ✅ Consistent output everywhere  
- ✅ Share configs across your stack
- ✅ No language-specific build tools

## 📖 API Reference

### `build(options)`

Build your module.

```typescript
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
  minify: true,
  sourcemap: true,
});
```

### `createWebpackBundleAnalyzer(options)`

Create a builder instance.

```typescript
const builder = createWebpackBundleAnalyzer({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
});
await builder.build();
```

### `watch(options)`

Watch mode for development.

```typescript
await watch({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
});
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm webpack-bundle-analyzer package](https://www.npmjs.com/package/webpack-bundle-analyzer) (~1M+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~1M+/week
- **Use case**: Bundle Size Analyzer
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
