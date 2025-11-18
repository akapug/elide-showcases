# csv-parser - Elide Polyglot Showcase

> **CSV parsing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Stream-based parsing
- Custom delimiters
- Header handling
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import csvParser from './elide-csv-parser.ts';

const parser = csvParser();
parser.on('data', (row) => console.log(row));
parser.on('end', () => console.log('Done'));
```

## Stats

- **npm downloads**: ~2M+/week
- **Elide advantage**: CSV parsing across all languages
