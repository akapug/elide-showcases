# Slice-ANSI - Slice ANSI Strings

Slice a string with ANSI escape codes in pure TypeScript.

## Features

- ✅ ANSI-aware slicing
- ✅ Preserves colors
- ✅ Simple API
- ✅ Zero dependencies

## Usage

```typescript
import sliceAnsi from './elide-slice-ansi.ts';

const text = '\x1b[31mRed Text\x1b[39m';
const sliced = sliceAnsi(text, 0, 3);
```

## NPM Stats

- 📦 ~40M+ downloads/week
- ✨ Zero dependencies
