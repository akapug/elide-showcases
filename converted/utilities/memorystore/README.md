# memorystore - Elide Polyglot Showcase

> **One memorystore implementation for ALL languages**

Memory session store with TTL expiration and automatic pruning.

## 🚀 Quick Start

```typescript
import MemoryStore from './elide-memorystore.ts';
const store = new MemoryStore({ checkPeriod: 60000 });
app.use(session({ store, secret: 'secret' }));
```

**npm downloads**: 2M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
