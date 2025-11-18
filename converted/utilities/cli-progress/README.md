# CLI-Progress - Multi Progress Bars

Easy to use progress bars for command-line applications in pure TypeScript.

## Features

- ✅ Single and multi progress bars
- ✅ Customizable format
- ✅ ETA calculation
- ✅ Zero dependencies

## Usage

```typescript
import { SingleBar } from './elide-cli-progress.ts';

const bar = new SingleBar();
bar.start(100, 0);
bar.update(50);
bar.stop();
```

## NPM Stats

- 📦 ~5M+ downloads/week
- ✨ Zero dependencies
