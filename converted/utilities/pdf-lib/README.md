# pdf-lib - Elide Polyglot Showcase

> **PDF creation and modification for ALL languages** - TypeScript, Python, Ruby, and Java

Create and modify PDF documents programmatically with full control.

## Features

- Create new PDFs from scratch
- Modify existing PDFs
- Add/remove pages
- Embed fonts and images
- Fill PDF forms
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { PDFDocument } from './elide-pdf-lib.ts';

// Create new PDF
const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage({ size: 'A4' });
page.drawText('Hello!', { x: 50, y: 750 });

// Save PDF
const pdfBytes = await pdfDoc.save();

// Load existing PDF
const existingDoc = await PDFDocument.load(pdfBytes);
const pages = existingDoc.getPages();
```

## Use Cases

- PDF form filling
- Document merging
- Watermarking
- PDF splitting
- Certificate generation

## Stats

- **npm downloads**: ~800K+/week
- **Use case**: PDF creation and modification
- **Elide advantage**: Consistent PDF manipulation across all languages
