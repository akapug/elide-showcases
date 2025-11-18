# matcher - Elide Polyglot Showcase

> **Simple wildcard matching for ALL languages**

Lightweight pattern matching with wildcards for basic needs.

## Features

- Simple wildcard syntax
- Case-sensitive/insensitive
- Lightweight
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { matcher, isMatch } from './elide-matcher.ts';

// Create matcher
const match = matcher('*.ts');
match('foo.ts');  // true
match('foo.js');  // false

// Direct match
isMatch('FOO.TS', '*.ts', { caseSensitive: false });  // true

// Multiple patterns
const match = matcher(['*.ts', '*.js']);
```

## Stats

- **npm downloads**: ~5M/week
- **Use case**: Simple pattern matching
