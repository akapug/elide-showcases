# sane - Elide Polyglot Showcase

> **Fast file watcher for ALL languages**

Wrapper around native file watchers with consistent API - used by Jest and Metro.

## Features

- Consistent cross-platform API
- Glob filtering
- Event-based watching
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { sane } from './elide-sane.ts';

const watcher = sane('src', {
  glob: ['**/*.ts']
});

watcher.on('change', (filepath) => {
  console.log(`File changed: ${filepath}`);
});

watcher.on('add', (filepath) => {
  console.log(`File added: ${filepath}`);
});

watcher.on('delete', (filepath) => {
  console.log(`File deleted: ${filepath}`);
});
```

## Stats

- **npm downloads**: ~8M/week
- **Use case**: Jest, Metro, build tools
