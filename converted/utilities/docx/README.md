# docx - Elide Polyglot Showcase

> **DOCX document generation for ALL languages** - TypeScript, Python, Ruby, and Java

Create Word documents (.docx) programmatically.

## Features

- Create DOCX documents
- Paragraphs and headings
- Tables and images
- Headers and footers
- Styling and formatting
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { Document, Paragraph, Packer } from './elide-docx.ts';

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: 'Hello World!' }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
```

## Use Cases

- Report generation
- Contract creation
- Resume building
- Letter templates
- Documentation export

## Stats

- **npm downloads**: ~200K+/week
- **Use case**: DOCX generation
- **Elide advantage**: Word documents across all languages
