# temp - Temporary Files - Elide Polyglot Showcase

> **One temp file manager for ALL languages**

Create and manage temporary files and directories with auto cleanup.

## 🚀 Quick Start

```typescript
import { mkdir, open, path, cleanup } from './elide-temp.ts';

// Create temp directory
const tempDir = await mkdir({ prefix: 'my-app-' });

// Create temp file
const tempFile = await open({ prefix: 'upload-', suffix: '.json' });

// Generate temp path (doesn't create file)
const tempPath = path({ prefix: 'cache-' });

// Cleanup
await cleanup();
```

## 📝 Stats

- **npm downloads**: ~500K+/week
- **Auto cleanup on exit**

---

**Built with ❤️ for the Elide Polyglot Runtime**
