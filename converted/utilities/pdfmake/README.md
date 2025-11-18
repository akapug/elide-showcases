# pdfmake - Elide Polyglot Showcase

> **PDF document generator for ALL languages** - TypeScript, Python, Ruby, and Java

Client and server-side PDF generation with declarative syntax.

## Features

- Declarative PDF definitions
- Tables and columns
- Images and vector graphics
- Headers and footers
- Page breaks
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { pdfMake } from './elide-pdfmake.ts';

// Create PDF
const doc = pdfMake.createPdf({
  content: [
    { text: 'Title', style: 'header' },
    { text: 'Content here' },
  ],
  styles: {
    header: { fontSize: 24, bold: true },
  },
});

// Get buffer
doc.getBuffer(buffer => {
  console.log(`PDF: ${buffer.length} bytes`);
});
```

## Use Cases

- Reports and invoices
- Certificates
- Tickets and labels
- Business documents
- Data exports

## Stats

- **npm downloads**: ~500K+/week
- **Use case**: PDF document generation
- **Elide advantage**: Declarative PDFs across all languages
