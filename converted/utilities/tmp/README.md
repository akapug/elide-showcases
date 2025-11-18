# tmp - Temporary Files - Elide Polyglot Showcase

> **One tmp creator for ALL languages**

Simple library for creating temporary files and directories.

## 🚀 Quick Start

```typescript
import { file, dir, tmpName } from './elide-tmp.ts';

// Create temp file
const tmpFile = await file({ prefix: 'upload-', postfix: '.json' });
console.log(tmpFile.name);
await tmpFile.removeCallback();  // Cleanup

// Create temp directory
const tmpDir = await dir({ prefix: 'cache-' });
console.log(tmpDir.name);
await tmpDir.removeCallback();  // Cleanup

// Generate temp name (doesn't create)
const name = tmpName({ prefix: 'session-' });
```

## 📝 Stats

- **npm downloads**: ~5M+/week
- **Auto cleanup callbacks**

---

**Built with ❤️ for the Elide Polyglot Runtime**
