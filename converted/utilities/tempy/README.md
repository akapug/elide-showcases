# tempy - Random Temp Paths - Elide Polyglot Showcase

> **One temp path generator for ALL languages**

Generate random temporary file and directory paths.

## 🚀 Quick Start

```typescript
import { file, directory, write } from './elide-tempy.ts';

// Generate temp file path
const filePath = file();
const jsonPath = file({ extension: '.json' });

// Generate temp directory path
const dirPath = directory();
const cachePath = directory({ prefix: 'cache-' });

// Write to temp file
const path = await write('Hello, World!', { extension: 'txt' });
```

## 📝 Stats

- **npm downloads**: ~500K+/week
- **Cryptographically random**

---

**Built with ❤️ for the Elide Polyglot Runtime**
