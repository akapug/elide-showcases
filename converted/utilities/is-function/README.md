# Function Detection (is-function) - Elide Polyglot Showcase

> **One function check for ALL languages** - TypeScript, Python, Ruby, and Java

Ultra-lightweight function detection for consistent type checking.

## ✨ Features

- ✅ Detect all function types (regular, async, generators, classes)
- ✅ TypeScript type guard support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Simple typeof check

## 🚀 Quick Start

```typescript
import isFunction from './elide-is-function.ts';

isFunction(() => {})           // true
isFunction(function() {})      // true
isFunction(async () => {})     // true
isFunction(class MyClass {})   // true
isFunction(42)                 // false
```

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Type checking, callback validation
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
