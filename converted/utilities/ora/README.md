# Ora - Terminal Spinner

Elegant terminal spinner with full control in pure TypeScript.

## Features

- ✅ Multiple spinner styles
- ✅ Custom text
- ✅ Success/fail/warn states
- ✅ Color support
- ✅ Zero dependencies

## Usage

```typescript
import ora from './elide-ora.ts';

const spinner = ora('Loading...').start();

setTimeout(() => {
  spinner.succeed('Done!');
}, 2000);
```

## NPM Stats

- 📦 ~25M+ downloads/week
- ✨ Zero dependencies
