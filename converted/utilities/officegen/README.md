# officegen - Elide Polyglot Showcase

> **Office document generation for ALL languages** - TypeScript, Python, Ruby, and Java

Generate DOCX, XLSX, and PPTX files programmatically.

## Features

- Create Word documents
- Create Excel spreadsheets
- Create PowerPoint presentations
- Charts and tables
- Images and shapes
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { createDocument } from './elide-officegen.ts';

// Word document
const docx = createDocument('docx');
const para = docx.createP();
para.addText('Hello!');

// PowerPoint
const pptx = createDocument('pptx');
const slide = pptx.addSlide();
slide.addText('Title');
```

## Use Cases

- Report generation
- Data export
- Presentation creation
- Document automation

## Stats

- **npm downloads**: ~100K+/week
- **Use case**: Office document generation
- **Elide advantage**: Office files across all languages
