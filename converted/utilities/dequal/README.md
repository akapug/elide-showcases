# Deep Equality (dequal) - Elide Polyglot Showcase

> **One deep equality for ALL languages** - TypeScript, Python, Ruby, and Java

Lightweight deep equality check that's faster and smaller than alternatives.

## ✨ Features

- ✅ Deep equality comparison
- ✅ Lightweight (<200 bytes minified)
- ✅ Fast performance
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import dequal from './elide-dequal.ts';

dequal({a: 1}, {a: 1})              // true
dequal([1, 2, 3], [1, 2, 3])        // true
dequal({a: 1}, {a: 2})              // false
dequal(NaN, NaN)                    // true
```

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: Lightweight deep equality
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
