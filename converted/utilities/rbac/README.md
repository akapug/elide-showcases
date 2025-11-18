# rbac - Elide Polyglot Showcase

> **One RBAC implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Complete role-based access control with hierarchical roles and permission management.

## ✨ Features

- ✅ Role management
- ✅ Permission assignment
- ✅ Hierarchical roles
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import RBAC from './elide-rbac.ts';

const rbac = new RBAC();
rbac.createRole('admin', [{ resource: 'article', action: 'delete' }]);
rbac.assignRole('alice', 'admin');
const can = rbac.check('alice', 'article', 'delete');
```

## 📝 Package Stats

- **npm downloads**: 300K+/week
- **Use case**: Role-based access control
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
