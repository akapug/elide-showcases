# path-key - Get PATH Key - Elide Polyglot Showcase

> **One PATH key getter for ALL languages**

Get the correct PATH environment variable key for the current platform.

## 🚀 Quick Start

```typescript
import pathKey from './elide-path-key.ts';

const key = pathKey();
// 'PATH' on Unix
// 'Path' on Windows

const pathValue = process.env[key];
```

## 📝 Stats

- **npm downloads**: ~10M+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
