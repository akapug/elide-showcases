# Tar - Elide Polyglot Showcase

> **One tar library for ALL languages**

## Quick Start

```typescript
import { pack, create } from './elide-tar.ts';

// Create tar
const packStream = pack();
packStream.entry({ name: 'file.txt' }, 'content');
packStream.finalize();

// Or use helper
await create({ file: 'archive.tar.gz', gzip: true }, ['file1.txt', 'file2.txt']);
```

## Package Stats

- **npm downloads**: ~10M/week
- **Polyglot score**: 37/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
