# pretty-ms Clone for Elide

Convert milliseconds to a human-readable string: `1337000000` → `15d 11h 23m 20s`

## Features

- **Human Readable**: Easy-to-understand time formatting
- **Configurable**: Multiple output formats
- **Compact/Verbose**: Choose detail level
- **Localization**: Customize time units
- **Type-Safe**: Full TypeScript support

## Installation

```bash
elide install pretty-ms-clone
```

## Quick Start

```typescript
import prettyMs from './pretty-ms-clone.ts'

prettyMs(1337000000)
// => "15d 11h 23m 20s"

prettyMs(1337)
// => "1.3s"

prettyMs(133)
// => "133ms"

// Compact format
prettyMs(1337, { compact: true })
// => "1s"

// Verbose format
prettyMs(1337000000, { verbose: true })
// => "15 days 11 hours 23 minutes 20 seconds"

// Seconds precision
prettyMs(1337000000, { secondsDecimalDigits: 0 })
// => "15d 11h 23m 20s"

// Keep milliseconds
prettyMs(1337, { keepDecimalsOnWholeSeconds: true })
// => "1.3s"
```

## API

### `prettyMs(milliseconds, options?)`

#### Options

```typescript
interface Options {
  // Seconds precision (default: 1)
  secondsDecimalDigits?: number

  // Milliseconds precision (default: 0)
  millisecondsDecimalDigits?: number

  // Keep decimals on whole seconds
  keepDecimalsOnWholeSeconds?: boolean

  // Compact format (1s vs 1 second)
  compact?: boolean

  // Verbose format (1 second vs 1s)
  verbose?: boolean

  // Separator (default: ' ')
  separateMilliseconds?: boolean

  // Format only milliseconds
  formatSubMilliseconds?: boolean

  // Column width padding
  colonNotation?: boolean

  // Unit count (show only N units)
  unitCount?: number
}
```

## Examples

```typescript
// Basic
prettyMs(1000)                    // "1s"
prettyMs(1000 * 60)              // "1m"
prettyMs(1000 * 60 * 60)         // "1h"
prettyMs(1000 * 60 * 60 * 24)    // "1d"

// Compact
prettyMs(1337, { compact: true })  // "1s"

// Verbose
prettyMs(1337, { verbose: true })  // "1 second"

// Precision
prettyMs(1337, { secondsDecimalDigits: 2 })  // "1.34s"

// Multiple units
prettyMs(95500, { unitCount: 2 })  // "1m 35s"

// Colon notation
prettyMs(95500, { colonNotation: true })  // "1:35.5"

// Keep decimals
prettyMs(1000, { keepDecimalsOnWholeSeconds: true })  // "1.0s"
```

## Use Cases

- Progress indicators
- Duration displays
- Performance metrics
- Time tracking
- API response times

## License

MIT
