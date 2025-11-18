# epub-parser - Elide Polyglot Showcase

> **EPUB parsing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse EPUB files
- Extract chapters
- Metadata extraction
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import parseEPUB from './elide-epub-parser.ts';

const book = await parseEPUB('book.epub');
console.log(book.metadata.title);
console.log(book.chapters);
```

## Stats

- **npm downloads**: ~20K+/week
- **Elide advantage**: EPUB parsing across all languages
