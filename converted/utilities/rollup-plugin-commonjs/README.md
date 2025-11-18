# CommonJS to ESM Converter - Elide Polyglot Showcase

> **One rollup-plugin-commonjs implementation for ALL languages** - TypeScript, Python, Ruby, and Java

CommonJS to ESM Converter with a single implementation that works across your entire polyglot stack.

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
import { build, createRollupPluginCommonjs } from './elide-rollup-plugin-commonjs.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createRollupPluginCommonjs({
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
rollup_plugin_commonjs = require('./elide-rollup-plugin-commonjs.ts')

# Build
rollup_plugin_commonjs.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
rollup_plugin_commonjs = Elide.require('./elide-rollup-plugin-commonjs.ts')

# Build
rollup_plugin_commonjs.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value rollupPluginCommonjs = context.eval("js", "require('./elide-rollup-plugin-commonjs.ts')");

// Build
rollupPluginCommonjs.invokeMember("build");
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

### `createRollupPluginCommonjs(options)`

Create a builder instance.

```typescript
const builder = createRollupPluginCommonjs({
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
- [npm rollup-plugin-commonjs package](https://www.npmjs.com/package/rollup-plugin-commonjs) (~1M+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~1M+/week
- **Use case**: CommonJS to ESM Converter
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
