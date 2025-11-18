# exceljs - Elide Polyglot Showcase

> **Excel workbook manipulation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Create/edit Excel files
- Styling and formatting
- Formulas and charts
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import { Workbook } from './elide-exceljs.ts';

const workbook = new Workbook();
const sheet = workbook.addWorksheet('Sheet1');
sheet.addRow(['Name', 'Age']);
sheet.addRow(['John', 30]);
const buffer = await workbook.xlsx.writeBuffer();
```

## Stats

- **npm downloads**: ~1M+/week
- **Elide advantage**: Excel manipulation across all languages
