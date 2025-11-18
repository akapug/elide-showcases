# Object Entries (object-entries) - Elide Polyglot Showcase

Object.entries polyfill/wrapper for polyglot consistency.

## 🚀 Quick Start

```typescript
import objectEntries from './elide-object-entries.ts';

objectEntries({a: 1, b: 2})    // [['a', 1], ['b', 2]]
objectEntries([1, 2])          // [['0', 1], ['1', 2]]
objectEntries({})              // []

// Iterate over entries
for (const [key, value] of objectEntries({x: 1, y: 2})) {
  console.log(key, value);
}
```

## 📝 Package Stats

- **npm downloads**: ~30M/week
- **Use case**: Iterating over objects
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
