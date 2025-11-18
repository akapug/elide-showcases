# make-dir - Elide Polyglot Showcase

> **Modern directory creation for ALL languages**

Promise-based directory creation with better defaults than mkdirp. Returns the created path.

## Features

- Returns created path
- Better error handling
- Modern promise-based API
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { makeDir } from './elide-make-dir.ts';

const path = await makeDir('build/assets');
console.log(`Created: ${path}`);

const dirs = await Promise.all([
  makeDir('dist/css'),
  makeDir('dist/js')
]);
```

## Stats

- **npm downloads**: ~60M/week
- **Use case**: Directory creation with feedback
