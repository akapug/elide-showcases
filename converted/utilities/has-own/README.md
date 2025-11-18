# Own Property Check (has-own) - Elide Polyglot Showcase

Check if an object has its own property (not inherited).

## 🚀 Quick Start

```typescript
import hasOwn from './elide-has-own.ts';

hasOwn({a: 1}, 'a')           // true
hasOwn({a: 1}, 'b')           // false
hasOwn({a: 1}, 'toString')    // false (inherited, not own)
hasOwn(null, 'a')             // false
```

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Own property checks
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
