# chokidar - Elide Polyglot Showcase

> **Efficient file watcher for ALL languages**

Fast cross-platform file watching with minimal resource usage - industry standard.

## Features

- Efficient file watching
- Event-based API
- Ignore patterns
- Cross-platform
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { watch } from './elide-chokidar.ts';

const watcher = watch('src', {
  ignored: /(^|\/)\../, // ignore dotfiles
  persistent: true
});

watcher
  .on('add', path => console.log(`File added: ${path}`))
  .on('change', path => console.log(`File changed: ${path}`))
  .on('unlink', path => console.log(`File removed: ${path}`));

// Later
watcher.close();
```

## Stats

- **npm downloads**: ~100M/week
- **Use case**: Build tools, dev servers, live reload
