# del - Elide Polyglot Showcase

> **Safe file deletion with glob support for ALL languages**

Promise-based deletion with dry-run mode and glob patterns.

## Features

- Glob pattern support
- Dry-run mode
- Negation patterns
- Safety checks
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { del } from './elide-del.ts';

// Delete with patterns
const deleted = await del(['temp/**', '*.log']);

// Dry run
const wouldDelete = await del('dist/**', { dryRun: true });

// With negation
await del(['dist/**', '!dist/important.js']);
```

## Stats

- **npm downloads**: ~15M/week
- **Use case**: Safe file deletion
