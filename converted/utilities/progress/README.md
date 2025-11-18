# Progress - Progress Bar

Flexible ASCII progress bar for Node.js in pure TypeScript.

## Features

- ✅ Customizable format
- ✅ ETA calculation
- ✅ Custom tokens
- ✅ Multiple bar styles
- ✅ Zero dependencies

## Usage

```typescript
import ProgressBar from './elide-progress.ts';

const bar = new ProgressBar('Downloading [:bar] :percent', {
  total: 100
});

bar.tick(25);
bar.tick(50);
bar.tick(25);
```

## NPM Stats

- 📦 ~25M+ downloads/week
- ✨ Zero dependencies
