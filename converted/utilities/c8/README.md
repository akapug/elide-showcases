# c8 - V8 Coverage

**Pure TypeScript implementation of c8 for Elide.**

Based on [c8](https://www.npmjs.com/package/c8) (~5M+ downloads/week)

## Features

- Native V8 coverage
- Source map support
- Multiple report formats
- Coverage thresholds
- Zero dependencies

## Installation

```bash
elide install @elide/c8
```

## Usage

```typescript
import C8 from './elide-c8.ts';

const c8 = new C8({
  reporter: ['text', 'html', 'lcov'],
  checkCoverage: true,
  lines: 80,
  functions: 85,
  branches: 75,
  statements: 80,
});

// Start profiling
c8.startProfiling();

// Run your tests
// ...

// Stop profiling
await c8.stopProfiling();

// Generate reports
await c8.report();
```

## Configuration

```typescript
interface C8Config {
  reporter?: string[];      // Report formats
  reportsDir?: string;      // Output directory
  tempDirectory?: string;   // Temp directory
  excludes?: string[];      // Exclude patterns
  include?: string[];       // Include patterns
  all?: boolean;            // Report all files
  src?: string[];           // Source directories
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
- `lcov` - LCOV format
- `json` - JSON data

## Performance

- **5M+ downloads/week** - Fast V8 coverage
- **Native V8** - Accurate coverage data

## License

MIT
