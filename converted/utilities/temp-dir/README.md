# temp-dir - System Temp Directory - Elide Polyglot Showcase

> **One temp dir getter for ALL languages**

Get the path to the system's temporary directory.

## 🚀 Quick Start

```typescript
import tempDir from './elide-temp-dir.ts';

console.log(tempDir);  // '/tmp' on Unix, 'C:\Users\...\Temp' on Windows

// Use in paths
import { join } from 'node:path';
const myTempFile = join(tempDir, 'my-file.txt');
```

## 📝 Stats

- **npm downloads**: ~2M+/week
- **Zero dependencies**

---

**Built with ❤️ for the Elide Polyglot Runtime**
