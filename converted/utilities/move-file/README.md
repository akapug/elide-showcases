# move-file - Elide Polyglot Showcase

> **Cross-platform file moving for ALL languages**

Promise-based file moving with cross-device support.

## Features

- Cross-device moves (copy+delete fallback)
- Overwrite protection
- Auto-create parent directories
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { moveFile } from './elide-move-file.ts';

// Move file
await moveFile('old.txt', 'new.txt');

// Move to directory
await moveFile('file.txt', 'backup/file.txt');

// Don't overwrite
await moveFile('source.txt', 'dest.txt', {
  overwrite: false
});
```

## Stats

- **npm downloads**: ~3M/week
- **Use case**: File organization
