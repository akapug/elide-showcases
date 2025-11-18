# minimatch - Elide Polyglot Showcase

> **Glob pattern matcher for ALL languages**

Match files using glob expressions - core matching library for many tools.

## Features

- Complete glob syntax support
- Case-insensitive matching
- Filter functions
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { minimatch, filter, match } from './elide-minimatch.ts';

// Basic matching
minimatch('foo.ts', '*.ts');        // true
minimatch('foo.ts', '*.js');        // false
minimatch('a/b/c.ts', '**/*.ts');   // true

// Create filter
const isTS = filter('*.ts');
['foo.ts', 'bar.js'].filter(isTS);  // ['foo.ts']

// Filter array
const files = ['a.ts', 'b.js', 'c.ts'];
match(files, '*.ts');  // ['a.ts', 'c.ts']
```

## Stats

- **npm downloads**: ~150M/week
- **Use case**: File filtering, pattern matching
