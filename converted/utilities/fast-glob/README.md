# fast-glob - Elide Polyglot Showcase

> **High-performance file globbing for ALL languages**

Optimized glob matching with advanced features and parallel traversal.

## Features

- High-performance matching
- Depth limiting
- Negation patterns
- Absolute paths
- Entry metadata
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { fastGlob } from './elide-fast-glob.ts';

// Basic usage
const files = await fastGlob('src/**/*.ts');

// With ignore
await fastGlob('**/*.ts', {
  ignore: ['node_modules/**', 'dist/**']
});

// Depth limit
await fastGlob('**/*.js', { deep: 2 });

// Directories only
await fastGlob('src/*', { onlyDirectories: true });

// Absolute paths
await fastGlob('*.ts', { absolute: true });
```

## Stats

- **npm downloads**: ~80M/week
- **Use case**: Build tools, test runners
