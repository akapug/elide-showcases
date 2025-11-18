# Shx - Elide Polyglot Showcase

> **One shx implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Cross-platform shell commands with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **platform-specific shell commands** in each language creates:
- ❌ Scripts that only work on Unix
- ❌ Windows compatibility issues
- ❌ Multiple implementations
- ❌ Fragmented build scripts

**Elide solves this** with ONE implementation that works EVERYWHERE.

## ✨ Features

- ✅ Cross-platform shell commands
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ No bash/sh required
- ✅ Windows/Mac/Linux compatible
- ✅ Exit codes and error handling

## 🚀 Quick Start

### TypeScript

```typescript
import Shx from './elide-shx.ts';

Shx.mkdir('build', true);
Shx.cp('src/index.ts', 'build/index.ts');
const result = Shx.ls('build');
console.log(result.output);
```

### Python

```python
from elide import require
Shx = require('./elide-shx.ts').default

Shx.mkdir('build', True)
Shx.cp('src/index.ts', 'build/index.ts')
result = Shx.ls('build')
print(result.output)
```

## 💡 Use Cases

Cross-platform npm scripts, build automation, CI/CD

## 🌐 Links

- [npm shx package](https://www.npmjs.com/package/shx) (original, ~500K/week downloads)

---

**Built with ❤️ for the Elide Polyglot Runtime**
