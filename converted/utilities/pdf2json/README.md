# pdf2json - Elide Polyglot Showcase

> **PDF to JSON conversion for ALL languages** - TypeScript, Python, Ruby, and Java

Convert PDF documents to JSON format for easy parsing and analysis.

## Features

- Convert PDF to JSON
- Extract text with coordinates
- Preserve layout information
- Page-by-page parsing
- Font information
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { PDF2JSON } from './elide-pdf2json.ts';

// Parse PDF file
const parser = new PDF2JSON();
await parser.parseFile('document.pdf');

// Get JSON structure
const json = parser.toJSON();
console.log(`Pages: ${json.pages.length}`);

// Access page data
const page1 = parser.getPage(1);
page1.texts.forEach(item => {
  console.log(`"${item.text}" at (${item.x}, ${item.y})`);
});
```

## Use Cases

- PDF data extraction
- Layout-aware parsing
- Form recognition
- Invoice processing
- Table extraction

## Stats

- **npm downloads**: ~100K+/week
- **Use case**: PDF to JSON conversion
- **Elide advantage**: Consistent JSON output across all languages
