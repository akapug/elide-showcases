# csv-stringify - Elide Polyglot Showcase

> **CSV generation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Array/object to CSV
- Custom delimiters
- Header generation
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { stringify } from './elide-csv-stringify.ts';

const data = [
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 },
];

const csv = stringify(data);
console.log(csv);
```

## Stats

- **npm downloads**: ~3M+/week
- **Elide advantage**: CSV generation across all languages
