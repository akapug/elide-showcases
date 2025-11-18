# Archiver - Archive Creator - Elide Polyglot Showcase

> **One archive creator for ALL languages** - TypeScript, Python, Ruby, and Java

Create ZIP and TAR archives with streaming support across your polyglot stack.

## ✨ Features

- ✅ ZIP and TAR format support
- ✅ Streaming API
- ✅ Directory support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { create } from './elide-archiver.ts';

const archive = create('zip');
archive.append('content', { name: 'file.txt' });
const zip = archive.finalize();
```

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Polyglot score**: 47/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
