# read-pkg-up - Elide Polyglot Showcase

> **Read closest package.json for ALL languages**

Read package.json walking up parent directories - combines find-up and read-pkg.

## Features

- Walk up to find and read package.json
- Returns package data and path
- Field normalization
- Custom starting directory
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { readPkgUp } from './elide-read-pkg-up.ts';

// Find and read closest package.json
const result = await readPkgUp();
if (result) {
  console.log('Found at:', result.path);
  console.log('Package:', result.packageJson.name);
  console.log('Version:', result.packageJson.version);
}

// From custom directory
const custom = await readPkgUp({ cwd: './nested/dir' });

// Without normalization
const raw = await readPkgUp({ normalize: false });

// Sync version
const resultSync = readPkgUpSync();
```

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Finding project package.json, CLI tools
