# is-glob - Elide Polyglot Showcase

> **Check if string is a glob pattern for ALL languages**

Fast and lightweight glob detection.

## Features

- Detect glob characters
- Strict mode validation
- Escaped character handling
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import isGlob from './elide-is-glob.ts';

isGlob('*.ts');           // true
isGlob('foo.ts');         // false
isGlob('**/*.js');        // true
isGlob('{a,b}.ts');       // true
isGlob('[a-z].ts');       // true
isGlob('!test.ts');       // true
isGlob('path/to/file');   // false
isGlob('\\*.ts');         // false (escaped)
```

## Stats

- **npm downloads**: ~120M/week
- **Use case**: Input validation, path processing
