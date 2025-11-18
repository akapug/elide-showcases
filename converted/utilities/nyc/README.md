# nyc - Coverage CLI

**Pure TypeScript implementation of nyc for Elide.**

Based on [nyc](https://www.npmjs.com/package/nyc) (~15M+ downloads/week)

## Features

- CLI coverage runner
- Multiple report formats
- Coverage thresholds
- Merge coverage data
- Zero dependencies

## Installation

```bash
elide install @elide/nyc
```

## Usage

```typescript
import NYC from './elide-nyc.ts';

const nyc = new NYC({
  reporter: ['text', 'html', 'lcov'],
  checkCoverage: true,
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
});

// Add coverage
nyc.addCoverage('file.ts', data);

// Generate reports
await nyc.report();

// Check thresholds
const passed = nyc.checkCoverage();
```

## Configuration

```typescript
interface NYCConfig {
  reporter?: string[];      // Report formats
  tempDir?: string;         // Temp directory
  reportDir?: string;       // Output directory
  exclude?: string[];       // Exclude patterns
  include?: string[];       // Include patterns
  checkCoverage?: boolean;  // Enable threshold checking
  lines?: number;           // Line threshold %
  functions?: number;       // Function threshold %
  branches?: number;        // Branch threshold %
  statements?: number;      // Statement threshold %
}
```

## Report Formats

- `text` - Console output
- `html` - HTML report
- `json` - JSON data
- `lcov` - LCOV format

## Performance

- **15M+ downloads/week** - Popular coverage tool

## License

MIT
