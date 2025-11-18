# p-locate - Locate Files with Promises - Elide Polyglot Showcase

> **One file locator for ALL languages**

Get the first path that exists by checking multiple paths in order.

## 🚀 Quick Start

```typescript
import { locateFile } from './elide-p-locate.ts';

const found = await locateFile([
  '.config.json',
  'config.json',
  '/etc/config.json'
]);

console.log(found);  // First existing path
```

## 📝 Stats

- **npm downloads**: ~10M+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
