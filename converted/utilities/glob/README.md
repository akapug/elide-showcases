# glob - Elide Polyglot Showcase

> **File pattern matching for ALL languages** - TypeScript, Python, Ruby, and Java

Match files using glob patterns with wildcards, negation, and advanced features across your polyglot stack.

## Features

- Wildcard matching (`*`, `**`, `?`)
- Brace expansion (`{a,b}`)
- Bracket expressions (`[a-z]`)
- Negation patterns
- Ignore patterns
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { glob, isGlob, escape } from './elide-glob.ts';

// Basic patterns
const tsFiles = await glob('**/*.ts');
const srcFiles = await glob('src/**/*.{ts,tsx}');

// With ignore
const files = await glob('**/*.js', {
  ignore: ['node_modules/**', 'dist/**']
});

// Check if string is glob
isGlob('*.ts');     // true
isGlob('file.ts');  // false
```

## Use Cases

- Build tools (webpack, vite, rollup)
- Test runners (jest, vitest)
- Linters (eslint, prettier)
- File processors
- Deployment scripts

## Stats

- **npm downloads**: ~120M/week
- **Use case**: File pattern matching
- **Elide advantage**: Consistent globbing across languages
