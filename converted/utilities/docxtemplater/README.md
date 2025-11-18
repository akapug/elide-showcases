# docxtemplater - Elide Polyglot Showcase

> **DOCX template engine for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Template-based DOCX generation
- Variable substitution
- Loops and conditions
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import Docxtemplater from './elide-docxtemplater.ts';

const doc = new Docxtemplater();
doc.setData({ name: 'John', date: '2025-01-15' });
doc.render();
const output = doc.getZip().generate();
```

## Stats

- **npm downloads**: ~100K+/week
- **Elide advantage**: DOCX templates across all languages
