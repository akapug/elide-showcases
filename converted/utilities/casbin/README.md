# casbin - Elide Polyglot Showcase

> **One casbin implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Complete authorization library with RBAC, ABAC, ACL support and policy-based access control.

## ✨ Features

- ✅ RBAC, ABAC, ACL support
- ✅ Policy-based access control
- ✅ Role inheritance
- ✅ Domain/tenant support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

### TypeScript

```typescript
import { newEnforcer } from './elide-casbin.ts';

const enforcer = newEnforcer();

// Add policies
enforcer.addPolicy('alice', 'data1', 'read');
enforcer.addPolicy('alice', 'data1', 'write');

// Add roles
enforcer.addRoleForUser('alice', 'admin');
enforcer.addPolicy('admin', '*', '*');

// Check permissions
const allowed = await enforcer.enforce('alice', 'data1', 'read');
```

## 📝 Package Stats

- **npm downloads**: 500K+/week
- **Use case**: Authorization, access control, permissions
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
