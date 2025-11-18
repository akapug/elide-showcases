# read-pkg - Elide Polyglot Showcase

> **Read package.json for ALL languages**

Read and parse package.json with normalization and validation.

## Features

- Read and parse package.json
- Field normalization
- Validation
- Custom CWD
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { readPkg } from './elide-read-pkg.ts';

// Read from current directory
const pkg = await readPkg();
console.log(`${pkg.name}@${pkg.version}`);

// Custom directory
const customPkg = await readPkg({
  cwd: './packages/foo'
});

// Without normalization
const raw = await readPkg({ normalize: false });

// Sync version
const pkgSync = readPkgSync();
```

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Build tools, CLI tools
