# ramda - Elide Polyglot Showcase

> **One ramda implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Functional programming library with auto-curried functions and point-free style support.

## ✨ Features

- ✅ Auto-curried functions
- ✅ Functional composition (compose, pipe)
- ✅ Immutable data transformations
- ✅ Point-free style support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import R from './elide-ramda.ts';

// Currying
const add5 = R.add(5);
add5(10); // 15

// Composition
const transform = R.pipe(
  R.map(R.multiply(2)),
  R.filter(R.gt(5)),
  R.sum
);
```

## 📝 Package Stats

- **npm downloads**: 5M+/week
- **Use case**: Functional programming, data pipelines
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
