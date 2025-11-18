# Property Check (has) - Elide Polyglot Showcase

Check if an object has a property (including inherited).

## 🚀 Quick Start

```typescript
import has from './elide-has.ts';

has({a: 1}, 'a')           // true
has({a: 1}, 'b')           // false
has({a: 1}, 'toString')    // true (inherited)
has(null, 'a')             // false
```

## 📝 Package Stats

- **npm downloads**: ~120M/week
- **Use case**: Property existence checks
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
