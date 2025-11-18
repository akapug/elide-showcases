# find-up - Elide Polyglot Showcase

> **Find files walking up directories for ALL languages**

Search for files by walking up parent directories - essential for config discovery.

## Features

- Walk up to find files/directories
- Multiple file name support
- Custom matcher functions
- Stop at specific directory
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { findUp } from './elide-find-up.ts';

// Find package.json
const pkgPath = await findUp('package.json');

// Multiple options
const config = await findUp([
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc'
]);

// Find directory
const nodeModules = await findUp('node_modules', {
  type: 'directory'
});

// Custom matcher
const gitRoot = await findUp(async (dir) => {
  const gitPath = `${dir}/.git`;
  try {
    await Deno.stat(gitPath);
    return '.git';
  } catch {
    return undefined;
  }
}, { type: 'directory' });
```

## Stats

- **npm downloads**: ~150M/week
- **Use case**: Config file discovery, project root finding
