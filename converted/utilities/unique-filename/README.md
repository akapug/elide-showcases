# unique-filename - Generate Unique Filenames - Elide Polyglot Showcase

> **One filename generator for ALL languages**

Generate unique filenames for temporary files with hash-based uniqueness.

## 🚀 Quick Start

```typescript
import uniqueFilename from './elide-unique-filename.ts';

// Basic usage
const file1 = uniqueFilename('/tmp');
// '/tmp/a3f2b1c4'

// With prefix
const upload = uniqueFilename('/tmp', 'upload');
// '/tmp/upload-a3f2b1c4'

// With prefix and suffix
const session = uniqueFilename('/tmp', 'session', 'data');
// '/tmp/session-a3f2b1c4-data'
```

## 📝 Stats

- **npm downloads**: ~5M+/week
- **Hash-based uniqueness**

---

**Built with ❤️ for the Elide Polyglot Runtime**
