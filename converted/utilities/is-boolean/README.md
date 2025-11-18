# Boolean Detection (is-boolean) - Elide Polyglot Showcase

> **One boolean check for ALL languages** - TypeScript, Python, Ruby, and Java

Ultra-lightweight boolean detection for consistent type checking.

## ✨ Features

- ✅ Detect boolean primitives and Boolean objects
- ✅ TypeScript type guard support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Ultra-fast

## 🚀 Quick Start

```typescript
import isBoolean from './elide-is-boolean.ts';

isBoolean(true)              // true
isBoolean(false)             // true
isBoolean(new Boolean(true)) // true
isBoolean(1)                 // false
isBoolean("true")            // false
```

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Use case**: Type checking, validation
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
