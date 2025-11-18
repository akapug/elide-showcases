# path-exists - Elide Polyglot Showcase

> **Check if path exists for ALL languages**

Simple utility to check if a file or directory exists - better ergonomics than fs.exists.

## Features

- Promise-based and sync versions
- Works with files and directories
- Simple boolean return
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { pathExists } from './elide-path-exists.ts';

// Check file
if (await pathExists('config.json')) {
  console.log('Config found!');
}

// Check directory
if (await pathExists('node_modules')) {
  console.log('Dependencies installed');
}

// Multiple checks
const [hasSrc, hasPkg, hasTs] = await Promise.all([
  pathExists('src/index.ts'),
  pathExists('package.json'),
  pathExists('tsconfig.json')
]);

// Sync version
if (pathExistsSync('.env')) {
  console.log('Environment file found');
}
```

## Stats

- **npm downloads**: ~100M/week
- **Use case**: Pre-flight checks, guard clauses
