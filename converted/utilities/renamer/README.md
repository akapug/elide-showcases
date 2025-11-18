# renamer - Elide Polyglot Showcase

> **Batch file renaming for ALL languages**

Rename multiple files with patterns, regex, and transformations.

## Features

- Find/replace with regex
- Custom transform functions
- Dry-run mode
- Glob pattern support
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import renamer from './elide-renamer.ts';

// Find/replace
await renamer('*.txt', { find: 'old', replace: 'new' });

// Regex
await renamer('*.js', { find: /\.js$/, replace: '.mjs' });

// Transform function
await renamer('*.txt', {
  transform: (name) => name.toUpperCase()
});

// Dry run
const results = await renamer('*.txt', {
  find: 'test',
  replace: 'prod',
  dryRun: true
});
```

## Stats

- **npm downloads**: ~50K/week
- **Use case**: Batch renaming
