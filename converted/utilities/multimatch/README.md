# multimatch - Elide Polyglot Showcase

> **Match against multiple patterns for ALL languages**

Filter arrays against multiple glob patterns with inclusion and exclusion.

## Features

- Multiple pattern support
- Negation patterns
- Include/exclude logic
- **Polyglot**: TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import multimatch from './elide-multimatch.ts';

const files = ['foo.ts', 'bar.js', 'test.ts'];

// Match multiple patterns
multimatch(files, ['*.ts', '*.js']);
// ['foo.ts', 'bar.js', 'test.ts']

// With negation
multimatch(files, ['*.ts', '!test.ts']);
// ['foo.ts']
```

## Stats

- **npm downloads**: ~15M/week
- **Use case**: File filtering, build pipelines
