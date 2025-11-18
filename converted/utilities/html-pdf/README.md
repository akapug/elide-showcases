# html-pdf - Elide Polyglot Showcase

> **HTML to PDF conversion for ALL languages** - TypeScript, Python, Ruby, and Java

Convert HTML documents to PDF files with full CSS support.

## Features

- Convert HTML to PDF
- CSS support
- Custom page size
- Headers and footers
- Image embedding
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { create } from './elide-html-pdf.ts';

// Simple conversion
const html = '<h1>Hello PDF!</h1>';
create(html).toFile('output.pdf', (err) => {
  console.log('PDF created!');
});

// With options
create(html, {
  format: 'A4',
  orientation: 'portrait',
  header: { contents: '<div>Header</div>' },
}).toBuffer((err, buffer) => {
  // Use buffer
});
```

## Use Cases

- Invoice generation
- Report export
- Email to PDF
- Web page archiving
- Receipt generation

## Stats

- **npm downloads**: ~300K+/week
- **Use case**: HTML to PDF conversion
- **Elide advantage**: Consistent PDF output from HTML across all languages
