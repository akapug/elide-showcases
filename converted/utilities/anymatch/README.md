# anymatch - Elide Polyglot Showcase

> **Match against mixed patterns for ALL languages**

Flexible matching against strings, regexes, and functions.

## Features

- String patterns (globs)
- Regular expressions
- Custom functions
- Mixed matchers
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import anymatch from './elide-anymatch.ts';

// String (glob)
anymatch('*.ts', 'foo.ts');  // true

// Regex
anymatch(/\.ts$/, 'foo.ts');  // true

// Function
anymatch((s) => s.length > 5, 'foo.ts');  // true

// Multiple matchers
anymatch(['*.ts', /\.js$/, (s) => s.includes('test')], 'foo.ts');
```

## Stats

- **npm downloads**: ~120M/week
- **Use case**: File watchers, flexible filtering
