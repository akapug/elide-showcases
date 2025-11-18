# CLUI - Command Line UI

Quickly build command-line UI elements in pure TypeScript.

## Features

- ✅ Progress bars
- ✅ Spinners
- ✅ Gauges
- ✅ Status indicators
- ✅ Zero dependencies

## Usage

```typescript
import { Progress, Spinner, Gauge } from './elide-clui.ts';

const progress = new Progress(30);
console.log(progress.update(75, 100, 'Downloading'));

const spinner = new Spinner();
console.log(spinner.update('Loading...'));

const gauge = new Gauge(25);
console.log(gauge.show(60, 100, 'Memory'));
```

## NPM Stats

- 📦 ~500K+ downloads/week
- ✨ Zero dependencies
