# picomatch - Elide Polyglot Showcase

> **Blazing fast glob matcher for ALL languages**

Ultra-fast glob matching with minimal overhead - used by many popular tools.

## Features

- Blazing fast performance
- Compiled matchers
- Regex generation
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { picomatch, isMatch, makeRe } from './elide-picomatch.ts';

// Create matcher
const matcher = picomatch('*.ts');
matcher('foo.ts');  // true
matcher('foo.js');  // false

// Direct match
isMatch('a/b/c.ts', '**/*.ts');  // true

// Get regex
const regex = makeRe('*.ts');
```

## Stats

- **npm downloads**: ~150M/week
- **Use case**: High-performance matching
