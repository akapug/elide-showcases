# SHA1 - Elide Polyglot Showcase

> **One SHA1 library for ALL languages**

SHA1 hashing for Git, file integrity, and legacy systems.

## 🚀 Quick Start

```typescript
import sha1 from './elide-sha1.ts';

const hash = await sha1('hello');
const gitHash = await sha1(`blob ${content.length}\x00${content}`);
```

## ⚠️ Security Note

SHA1 is deprecated for security. Use SHA-256 for new applications.

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Git, file integrity, legacy systems

---

**Built with ❤️ for the Elide Polyglot Runtime**
