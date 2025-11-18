# pkg-dir - Elide Polyglot Showcase

> **Find package directory for ALL languages**

Find the root directory of an npm package by walking up to find package.json.

## Features

- Walk up to find package root
- Custom starting directory
- Async/sync versions
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { pkgDir } from './elide-pkg-dir.ts';

// Find package root from current directory
const rootDir = await pkgDir();
console.log('Package root:', rootDir);

// From custom directory
const customRoot = await pkgDir('/path/to/nested/dir');

// Sync version
const rootDirSync = pkgDirSync();

// Use in paths
const configPath = `${await pkgDir()}/config.json`;
```

## Stats

- **npm downloads**: ~120M/week
- **Use case**: Finding project root, config resolution
