# pdf-parse - Elide Polyglot Showcase

> **PDF text extraction for ALL languages** - TypeScript, Python, Ruby, and Java

Extract text content and metadata from PDF files.

## Features

- Extract text from PDFs
- Get metadata (title, author, pages)
- Parse PDF structure
- Handle multi-page documents
- Fast parsing
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import parsePDF from './elide-pdf-parse.ts';

// Parse PDF file
const pdfBuffer = fs.readFileSync('document.pdf');
const data = await parsePDF(pdfBuffer);

console.log(`Pages: ${data.numpages}`);
console.log(`Text: ${data.text}`);
console.log(`Title: ${data.info.Title}`);
console.log(`Author: ${data.info.Author}`);
```

## Use Cases

- Document indexing
- PDF search
- Data extraction
- Content analysis
- OCR preprocessing

## Stats

- **npm downloads**: ~200K+/week
- **Use case**: PDF text extraction
- **Elide advantage**: Consistent PDF parsing across all languages
