# Environment Variable Replacement - Elide Polyglot Showcase

> **One envify implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Environment Variable Replacement with a single implementation that works across your entire polyglot stack.

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
import { build, createEnvify } from './elide-envify.ts';

// Basic build
await build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm',
});

// Advanced usage
const builder = createEnvify({
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
envify = require('./elide-envify.ts')

# Build
envify.build({
  'input': 'src/index.ts',
  'output': 'dist/bundle.js',
  'format': 'esm'
})
```

### Ruby
```ruby
envify = Elide.require('./elide-envify.ts')

# Build
envify.build({
  input: 'src/index.ts',
  output: 'dist/bundle.js',
  format: 'esm'
})
```

### Java
```java
Value envify = context.eval("js", "require('./elide-envify.ts')");

// Build
envify.invokeMember("build");
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

### `createEnvify(options)`

Create a builder instance.

```typescript
const builder = createEnvify({
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
- [npm envify package](https://www.npmjs.com/package/envify) (~300K+ downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~300K+/week
- **Use case**: Environment Variable Replacement
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making builds consistent, everywhere.*
