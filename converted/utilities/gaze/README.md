# gaze - Elide Polyglot Showcase

> **Simple file watcher for ALL languages**

Glob-based file watching with simple API.

## Features

- Glob pattern support
- Simple event API
- Lightweight
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { gaze } from './elide-gaze.ts';

gaze('src/**/*.ts', (err, watcher) => {
  watcher.on('changed', (filepath) => {
    console.log(`Changed: ${filepath}`);
  });

  watcher.on('added', (filepath) => {
    console.log(`Added: ${filepath}`);
  });
});
```

## Stats

- **npm downloads**: ~5M/week
- **Use case**: Simple file watching
