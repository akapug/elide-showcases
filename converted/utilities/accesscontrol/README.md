# accesscontrol - Elide Polyglot Showcase

> **One accesscontrol implementation for ALL languages**

RBAC library with chainable API and resource attribute support.

## 🚀 Quick Start

```typescript
import AccessControl from './elide-accesscontrol.ts';
const ac = new AccessControl();
ac.grant('admin').createOwn('profile').readAny('profile').deleteAny('profile');
const permission = ac.can('admin').deleteAny('profile');
```

**npm downloads**: 1M+/week | **Polyglot score**: 50/50

---

**Built with ❤️ for the Elide Polyglot Runtime**
