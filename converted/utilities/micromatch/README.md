# micromatch - Elide Polyglot Showcase

> **Advanced glob matching for ALL languages**

Powerful glob matching with extended features - faster alternative to minimatch.

## Features

- Advanced glob patterns
- Brace expansion
- Extended glob
- Negation support
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { micromatch, isMatch, not } from './elide-micromatch.ts';

// Match array
micromatch(['foo.ts', 'bar.js'], '*.ts');  // ['foo.ts']

// Test match
isMatch('a/b/c.ts', '**/*.ts');  // true

// Negate
const files = ['a.ts', 'b.js', 'c.ts'];
not(files, '*.ts');  // ['b.js']
```

## Stats

- **npm downloads**: ~120M/week
- **Use case**: File filtering, build tools
