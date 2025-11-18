# Log-Update - Log Overwriting

Log by overwriting the previous output in the terminal in pure TypeScript.

## Features

- ✅ Overwrite previous log
- ✅ Multiple line support
- ✅ Restore cursor position
- ✅ Perfect for progress indicators
- ✅ Zero dependencies

## Usage

```typescript
import logUpdate from './elide-log-update.ts';

let i = 0;
const interval = setInterval(() => {
  logUpdate(`Count: ${i++}`);
}, 100);
```

## NPM Stats

- 📦 ~15M+ downloads/week
- ✨ Zero dependencies
