# locate-path - Elide Polyglot Showcase

> **Find first existing path for ALL languages**

Get the first path that exists from a list - commonly used with find-up.

## Features

- Find first existing path from list
- File or directory type filtering
- Symlink handling
- Custom CWD
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { locatePath } from './elide-locate-path.ts';

// Find first existing config
const config = await locatePath([
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.yaml'
]);

// Files only
const file = await locatePath(
  ['README.md', 'readme.txt'],
  { type: 'file' }
);

// Directories only
const dir = await locatePath(
  ['node_modules', 'vendor'],
  { type: 'directory' }
);
```

## Stats

- **npm downloads**: ~120M/week
- **Use case**: Config discovery, fallback resolution
