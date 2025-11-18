# globby - Elide Polyglot Showcase

> **User-friendly glob matching for ALL languages** - TypeScript, Python, Ruby, and Java

Promise-based glob matching with gitignore support and better defaults than glob.

## Features

- Promise-based API
- Gitignore support
- Negation patterns (`!pattern`)
- Better defaults (files only, etc.)
- Sync and async versions
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { globby, isMatch } from './elide-globby.ts';

// Simple usage
const files = await globby('*.ts');

// Multiple patterns with negation
const src = await globby(['src/**/*.ts', '!**/*.test.ts']);

// Gitignore support
const all = await globby('**/*', { gitignore: true });

// Match test
isMatch('foo.ts', '*.ts');  // true
```

## Use Cases

- Build tools with gitignore
- File processing pipelines
- Test file discovery
- Deployment scripts
- Code generators

## Stats

- **npm downloads**: ~40M/week
- **Use case**: User-friendly globbing
- **Elide advantage**: Consistent across all languages
