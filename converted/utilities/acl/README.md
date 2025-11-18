# acl - Elide Polyglot Showcase

> **One ACL implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Complete access control lists with role-based permissions and resource management.

## ✨ Features

- ✅ Role-based permissions
- ✅ Resource control
- ✅ User/role management
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import ACL from './elide-acl.ts';

const acl = new ACL();
acl.allow('admin', 'blog', ['create', 'read', 'update', 'delete']);
acl.addUserRoles('alice', 'admin');

const allowed = await acl.isAllowedAsync('alice', 'blog', 'delete');
```

## 📝 Package Stats

- **npm downloads**: 2M+/week
- **Use case**: Access control, permissions
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
