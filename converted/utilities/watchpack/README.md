# watchpack - Elide Polyglot Showcase

> **Webpack file watcher for ALL languages**

File and directory watcher used by webpack - optimized for build tools.

## Features

- Separate file/directory watching
- Aggregated change events
- Optimized for webpack
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { Watchpack } from './elide-watchpack.ts';

const wp = new Watchpack({
  aggregateTimeout: 1000
});

wp.watch(['src/index.ts'], ['src'], Date.now());

wp.on('change', (file, mtime) => {
  console.log(`Changed: ${file}`);
});

wp.on('aggregated', (changes, removals) => {
  console.log('Aggregated changes:', changes);
});
```

## Stats

- **npm downloads**: ~40M/week
- **Use case**: Webpack, build tools
