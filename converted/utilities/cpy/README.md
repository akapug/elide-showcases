# cpy - Elide Polyglot Showcase

> **Copy files with glob support for ALL languages**

Promise-based file copying with glob patterns and structure preservation.

## Features

- Glob pattern support
- Preserve directory structure
- Flatten option
- Rename during copy
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import cpy from './elide-cpy.ts';

// Copy with glob
await cpy('*.ts', 'backup');

// Preserve structure
await cpy('src/**/*.ts', 'dist', { parents: true });

// Flatten
await cpy('src/**/*.ts', 'dist', { flat: true });

// Rename
await cpy('*.js', 'dist', {
  rename: (name) => name.replace('.js', '.mjs')
});
```

## Stats

- **npm downloads**: ~5M/week
- **Use case**: File copying with patterns
