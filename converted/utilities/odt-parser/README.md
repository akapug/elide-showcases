# odt-parser - Elide Polyglot Showcase

> **ODT document parsing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse ODT files
- Extract text
- Metadata extraction
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import parseODT from './elide-odt-parser.ts';

const buffer = fs.readFileSync('document.odt');
const result = await parseODT(buffer);
console.log(result.text);
```

## Stats

- **npm downloads**: ~5K+/week
- **Elide advantage**: ODT parsing across all languages
