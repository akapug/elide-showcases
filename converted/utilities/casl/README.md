# casl - Elide Polyglot Showcase

> **One CASL implementation for ALL languages**

Authorization library with ability-based permissions and field-level access.

## 🚀 Quick Start

```typescript
import { defineAbility } from './elide-casl.ts';
const ability = defineAbility((can, cannot) => {
  can('read', 'Article');
  cannot('delete', 'Article');
});
const canRead = ability.can('read', 'Article');
```

**npm downloads**: 1M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
