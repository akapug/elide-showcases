# String-Width - Get String Width

Get the visual width of a string (ANSI codes excluded) in pure TypeScript.

## Features

- ✅ ANSI code handling
- ✅ Accurate width calculation
- ✅ Simple API
- ✅ Zero dependencies

## Usage

```typescript
import stringWidth from './elide-string-width.ts';

const width = stringWidth('\x1b[31mHello\x1b[39m');
console.log(width); // 5
```

## NPM Stats

- 📦 ~150M+ downloads/week
- ✨ Zero dependencies
