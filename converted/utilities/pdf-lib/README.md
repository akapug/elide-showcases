# PDF-Lib - Elide Polyglot Showcase

> **One PDF library for ALL languages**

## Quick Start

```typescript
import { PDFDocument, StandardFonts } from './elide-pdf-lib.ts';

const doc = await PDFDocument.create();
const page = doc.addPage();

page.drawText('Hello, PDF!', {
  x: 50,
  y: 750,
  size: 30
});

const pdfBytes = await doc.save();
```

## Package Stats

- **npm downloads**: ~3M/week
- **Polyglot score**: 38/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
