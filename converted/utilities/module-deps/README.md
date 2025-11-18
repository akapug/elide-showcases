# Module Dependency Walker - Elide Polyglot Showcase

> **One module-deps implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Module Dependency Walker with a single implementation that works across your entire polyglot stack.

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
import { build, createModuleDeps } from './elide-module-deps.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createModuleDeps({
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
module_deps = require('./elide-module-deps.ts')

# Build
module_deps.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
module_deps = Elide.require('./elide-module-deps.ts')

# Build
module_deps.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value moduleDeps = context.eval("js", "require('./elide-module-deps.ts')");

// Build
moduleDeps.invokeMember("build");
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

### `createModuleDeps(options)`

Create a builder instance.

```typescript
const builder = createModuleDeps({
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
- [npm module-deps package](https://www.npmjs.com/package/module-deps) (~100K+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Module Dependency Walker
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
