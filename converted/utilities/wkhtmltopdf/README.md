# wkhtmltopdf - Elide Polyglot Showcase

> **HTML to PDF using WebKit for ALL languages** - TypeScript, Python, Ruby, and Java

Convert HTML to PDF using the WebKit rendering engine.

## Features

- HTML to PDF conversion
- WebKit rendering
- Custom page size
- Headers/footers
- Table of contents
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import wkhtmltopdf from './elide-wkhtmltopdf.ts';

const stream = wkhtmltopdf('<h1>Hello!</h1>', {
  pageSize: 'A4',
  orientation: 'Portrait',
});

stream.pipe(fs.createWriteStream('output.pdf'));
```

## Use Cases

- Document generation
- Report creation
- Invoice printing
- Web archiving

## Stats

- **npm downloads**: ~50K+/week
- **Use case**: HTML to PDF conversion
- **Elide advantage**: WebKit rendering across all languages
