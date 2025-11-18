# ncp - Recursive File Copying - Elide Polyglot Showcase

> **One recursive copier for ALL languages**

Copy files and directories recursively with filtering support.

## 🚀 Quick Start

```typescript
import ncp from './elide-ncp.ts';

// Copy directory
await ncp('src/', 'dist/');

// Copy with filter
await ncp('src/', 'dist/', { filter: /\.ts$/ });

// Don't overwrite
await ncp('src/', 'dist/', { clobber: false });
```

## 📝 Stats

- **npm downloads**: ~500K+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
