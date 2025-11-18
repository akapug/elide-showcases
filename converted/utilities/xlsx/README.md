# xlsx - Elide Polyglot Showcase

> **Excel spreadsheet parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and write Excel files (XLSX, XLS, CSV).

## Features

- Read/write Excel files
- Parse CSV, XLSX, XLS
- JSON to/from sheets
- Formula support
- Styling and formatting
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import XLSX from './elide-xlsx.ts';

// Read Excel
const workbook = XLSX.readFile('data.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet);

// Create Excel
const newWB = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet([
  { Name: 'John', Age: 30 },
]);
XLSX.utils.book_append_sheet(newWB, ws, 'Sheet1');
XLSX.writeFile(newWB, 'output.xlsx');
```

## Use Cases

- Data import/export
- Report generation
- CSV processing
- Spreadsheet automation

## Stats

- **npm downloads**: ~3M+/week
- **Use case**: Excel file processing
- **Elide advantage**: Excel parsing across all languages
