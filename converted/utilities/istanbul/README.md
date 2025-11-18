# istanbul - Code Coverage

**Pure TypeScript implementation of istanbul for Elide.**

Based on [istanbul](https://www.npmjs.com/package/istanbul) (~20M+ downloads/week)

## Features

- Code coverage instrumentation
- Statement/branch/function coverage
- Multiple report formats
- Zero dependencies

## Installation

```bash
elide install @elide/istanbul
```

## Usage

```typescript
import istanbul from './elide-istanbul.ts';

// Instrument code
const instrumented = istanbul.instrument(code, 'file.js');

// Record coverage
istanbul.recordCoverage('file.js', coverageData);

// Get summary
const summary = istanbul.getSummary();

// Generate report
console.log(istanbul.report('text'));
```

## API Reference

- `instrument(code, filename)` - Instrument code
- `recordCoverage(filename, data)` - Record coverage
- `getSummary()` - Get summary stats
- `report(format)` - Generate report
- `reset()` - Clear coverage
- `getFileCoverage(filename)` - Get file data

## Performance

- **20M+ downloads/week** - Industry standard

## License

MIT
