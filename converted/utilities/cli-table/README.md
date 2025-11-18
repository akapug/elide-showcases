# CLI-Table - ASCII Tables

Beautiful ASCII tables for the command line in pure TypeScript.

## Features

- ✅ ASCII table rendering
- ✅ Custom borders
- ✅ Column alignment
- ✅ Flexible widths
- ✅ Zero dependencies

## Usage

```typescript
import Table from './elide-cli-table.ts';

const table = new Table({
  head: ['Name', 'Age', 'City']
});

table.push(['Alice', '25', 'NYC']);
table.push(['Bob', '30', 'SF']);

console.log(table.toString());
```

## NPM Stats

- 📦 ~8M+ downloads/week
- ✨ Zero dependencies
