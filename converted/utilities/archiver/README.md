# Archiver - Elide Polyglot Showcase

> **One archive library for ALL languages**

## Quick Start

```typescript
import { create } from './elide-archiver.ts';

const archive = create('zip');

archive
  .file('file1.txt')
  .file('file2.txt')
  .directory('src/', 'source/')
  .finalize();
```

## Package Stats

- **npm downloads**: ~7M/week
- **Polyglot score**: 36/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
