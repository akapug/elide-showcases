# PDFKit - Elide Polyglot Showcase

> **PDF document generation for ALL languages** - TypeScript, Python, Ruby, and Java

Create complex, multi-page PDF documents with graphics, text, and images.

## Features

- Multi-page PDF generation
- Vector graphics (lines, shapes, paths)
- Text rendering with fonts
- Image embedding (JPEG, PNG)
- Annotations and links
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { PDFDocument } from './elide-pdfkit.ts';

// Create simple PDF
const doc = new PDFDocument();
doc.fontSize(25).text('Hello PDF!', 100, 100);
doc.end();

// Invoice example
const invoice = new PDFDocument();
invoice.fontSize(20).text('Invoice', { align: 'center' });
invoice.moveDown();
invoice.fontSize(12).text('Customer: John Doe');
invoice.text('Amount: $100.00');

// Add shapes
doc.rect(100, 100, 200, 100).stroke();
doc.circle(200, 250, 50).fill('#FF0000');
```

## Use Cases

- Invoice generation
- Report creation
- Certificate printing
- Document export
- Label generation

## Stats

- **npm downloads**: ~1M+/week
- **Use case**: PDF document generation
- **Elide advantage**: Consistent PDF output across all languages
