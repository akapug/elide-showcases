# mkdirp - Elide Polyglot Showcase

> **Recursive directory creation for ALL languages** - TypeScript, Python, Ruby, and Java

Unix `mkdir -p` for Node.js and Elide - create directories and all parent directories.

## Features

- Recursive creation
- No error if exists
- Permission modes
- Sync and async versions
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { mkdirp, mkdirpSync } from './elide-mkdirp.ts';

// Create nested directories
await mkdirp('path/to/deep/directory');

// With permissions
await mkdirp('secure-dir', { mode: 0o700 });

// Batch creation
await Promise.all([
  mkdirp('dist/assets'),
  mkdirp('dist/static'),
  mkdirp('dist/pages')
]);

// Sync version
mkdirpSync('output');
```

## Use Cases

- Build output directories
- Log file directories
- Cache directories
- Upload directories
- Test fixtures

## Stats

- **npm downloads**: ~120M/week
- **Use case**: Directory creation
- **Elide advantage**: Works identically in all languages
