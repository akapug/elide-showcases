# CLIUI - CLI Layout

Easily create complex CLI layouts in pure TypeScript.

## Features

- ✅ Column layouts
- ✅ Text alignment
- ✅ Width control
- ✅ Padding support
- ✅ Zero dependencies

## Usage

```typescript
import cliui from './elide-cliui.ts';

const ui = cliui({ width: 80 });

ui.div('Name', 'Status', 'Time');
ui.div('Task 1', 'Done', '1.2s');
ui.div('Task 2', 'Running', '0.5s');

console.log(ui.toString());
```

## NPM Stats

- 📦 ~100M+ downloads/week
- ✨ Zero dependencies
