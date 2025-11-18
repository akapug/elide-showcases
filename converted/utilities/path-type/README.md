# path-type - Check Path Type - Elide Polyglot Showcase

> **One path type checker for ALL languages**

Check whether a path is a file, directory, or symlink.

## 🚀 Quick Start

```typescript
import { isFile, isDirectory, isSymlink } from './elide-path-type.ts';

// Async
await isFile('/path/to/file.txt');      // true
await isDirectory('/path/to/dir');       // true
await isSymlink('/path/to/symlink');     // true

// Sync
isFileSync('/path/to/file.txt');         // true
```

## 📝 Stats

- **npm downloads**: ~2M+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
