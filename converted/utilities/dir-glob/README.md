# dir-glob - Elide Polyglot Showcase

> **Convert directories to glob patterns for ALL languages**

Convert directory paths to glob patterns for file matching.

## Features

- Auto-convert directories to globs
- Extension filtering
- Specific file targeting
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { dirGlob } from './elide-dir-glob.ts';

// Convert directory
const patterns = await dirGlob('src');
// Returns: ["src/**"]

// With extensions
const patterns = await dirGlob('src', {
  extensions: ['ts', 'tsx']
});
// Returns: ["src/**/*.{ts,tsx}"]

// Specific files
const patterns = await dirGlob('.', {
  files: ['package.json', 'tsconfig.json']
});

// Multiple directories
const patterns = await dirGlob(
  ['src', 'tests'],
  { extensions: ['ts'] }
);
```

## Stats

- **npm downloads**: ~40M/week
- **Use case**: Build tools, linters
