# String Detection (is-string) - Elide Polyglot Showcase

> **One string check for ALL languages** - TypeScript, Python, Ruby, and Java

Ultra-lightweight string detection with consistent behavior across your entire polyglot stack.

## ✨ Features

- ✅ Detect string primitives
- ✅ Detect String objects
- ✅ TypeScript type guard support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Ultra-fast

## 🚀 Quick Start

```typescript
import isString from './elide-is-string.ts';

isString("hello")           // true
isString(new String("hi"))  // true
isString(42)                // false
isString(null)              // false

// Filter strings from mixed array
["hello", 42, "world"].filter(isString)  // ["hello", "world"]
```

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Type checking, validation, filtering
- **Elide advantage**: Polyglot consistency

## 🌐 Links

- [npm is-string package](https://www.npmjs.com/package/is-string) (~40M downloads/week)

---

**Built with ❤️ for the Elide Polyglot Runtime**
