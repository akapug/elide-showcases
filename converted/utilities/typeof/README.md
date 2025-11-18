# Better typeof (typeof) - Elide Polyglot Showcase

A better typeof that handles arrays and null correctly.

## 🚀 Quick Start

```typescript
import typeOf from './elide-typeof.ts';

typeOf([])           // 'array' (not 'object')
typeOf(null)         // 'null' (not 'object')
typeOf({})           // 'object'
typeOf(42)           // 'number'
```

## 📝 Package Stats

- **npm downloads**: ~10M/week
- **Use case**: Better type checking
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
