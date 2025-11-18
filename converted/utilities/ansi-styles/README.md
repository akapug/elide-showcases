# ANSI-Styles - ANSI Styling

ANSI escape codes for styling strings in the terminal in pure TypeScript.

## Features

- ✅ Text modifiers
- ✅ Foreground colors
- ✅ Background colors
- ✅ 256 color support
- ✅ Zero dependencies

## Usage

```typescript
import ansiStyles from './elide-ansi-styles.ts';

const { modifier, color } = ansiStyles;

console.log(`\x1b[${modifier.bold[0]}mBold\x1b[${modifier.bold[1]}m`);
console.log(`\x1b[${color.red[0]}mRed\x1b[${color.red[1]}m`);
```

## NPM Stats

- 📦 ~120M+ downloads/week
- ✨ Zero dependencies
