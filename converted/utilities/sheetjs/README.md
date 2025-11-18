# sheetjs - Elide Polyglot Showcase

> **Spreadsheet parser for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Parse XLSX, XLS, CSV, ODS
- Write multiple formats
- Formula parsing
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import XLSX from './elide-sheetjs.ts';

const wb = XLSX.read(fileData);
const json = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1);
```

## Stats

- **npm downloads**: ~2M+/week
- **Elide advantage**: Spreadsheet parsing across all languages
