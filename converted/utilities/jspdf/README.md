# jsPDF - Elide Polyglot Showcase

> **Client-side PDF generation for ALL languages** - TypeScript, Python, Ruby, and Java

Generate PDF files in pure JavaScript for browser and server.

## Features

- Client-side PDF generation
- Add text, images, shapes
- Multiple pages
- Font support
- Auto-paging
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { jsPDF } from './elide-jspdf.ts';

// Create PDF
const doc = new jsPDF();
doc.text('Hello World!', 10, 10);
doc.save('document.pdf');

// Multi-page
doc.addPage();
doc.text('Page 2', 10, 10);

// Get output
const pdfData = doc.output('arraybuffer');
```

## Use Cases

- Browser-based PDF export
- Report generation
- Invoice creation
- Certificate printing
- Form export

## Stats

- **npm downloads**: ~1M+/week
- **Use case**: Client-side PDF generation
- **Elide advantage**: Consistent PDF output across all languages
