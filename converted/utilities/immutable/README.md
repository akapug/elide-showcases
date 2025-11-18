# immutable - Elide Polyglot Showcase

> **One immutable implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Persistent immutable data structures with structural sharing.

## ✨ Features

- ✅ Immutable List, Map, Set
- ✅ Structural sharing for performance
- ✅ Persistent data structures
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { List, Map, Set } from './elide-immutable.ts';

const list1 = List.of(1, 2, 3);
const list2 = list1.push(4); // Original unchanged

const map1 = Map.of({ a: 1 });
const map2 = map1.set('b', 2); // Original unchanged
```

## 📝 Package Stats

- **npm downloads**: 15M+/week
- **Use case**: State management, immutable data
- **Polyglot score**: 46/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
