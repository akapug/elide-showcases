# Node Module Resolution - Elide Polyglot Showcase

> **One rollup-plugin-node-resolve implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Node Module Resolution with a single implementation that works across your entire polyglot stack.

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
import { build, createRollupPluginNodeResolve } from './elide-rollup-plugin-node-resolve.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createRollupPluginNodeResolve({
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
rollup_plugin_node_resolve = require('./elide-rollup-plugin-node-resolve.ts')

# Build
rollup_plugin_node_resolve.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
rollup_plugin_node_resolve = Elide.require('./elide-rollup-plugin-node-resolve.ts')

# Build
rollup_plugin_node_resolve.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value rollupPluginNodeResolve = context.eval("js", "require('./elide-rollup-plugin-node-resolve.ts')");

// Build
rollupPluginNodeResolve.invokeMember("build");
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

### `createRollupPluginNodeResolve(options)`

Create a builder instance.

```typescript
const builder = createRollupPluginNodeResolve({
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
- [npm rollup-plugin-node-resolve package](https://www.npmjs.com/package/rollup-plugin-node-resolve) (~1M+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~1M+/week
- **Use case**: Node Module Resolution
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
