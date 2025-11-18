# Object Detection (is-object) - Elide Polyglot Showcase

> **One object check for ALL languages** - TypeScript, Python, Ruby, and Java

Reliable object detection that excludes arrays and null.

## ✨ Features

- ✅ Detect objects (excluding arrays and null)
- ✅ TypeScript type guard support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Fast type check

## 🚀 Quick Start

```typescript
import isObject from './elide-is-object.ts';

isObject({})               // true
isObject({a: 1})           // true
isObject(new Date())       // true
isObject([])               // false (array)
isObject(null)             // false
```

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Use case**: Type checking, validation
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
