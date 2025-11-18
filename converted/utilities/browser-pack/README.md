# Pack Modules for Browser - Elide Polyglot Showcase

> **One browser-pack implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Pack Modules for Browser with a single implementation that works across your entire polyglot stack.

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
import { build, createBrowserPack } from './elide-browser-pack.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createBrowserPack({
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
browser_pack = require('./elide-browser-pack.ts')

# Build
browser_pack.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
browser_pack = Elide.require('./elide-browser-pack.ts')

# Build
browser_pack.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value browserPack = context.eval("js", "require('./elide-browser-pack.ts')");

// Build
browserPack.invokeMember("build");
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

### `createBrowserPack(options)`

Create a builder instance.

```typescript
const builder = createBrowserPack({
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
- [npm browser-pack package](https://www.npmjs.com/package/browser-pack) (~100K+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Pack Modules for Browser
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
