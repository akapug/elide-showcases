# Filesize Clone for Elide

Convert file sizes to human-readable strings.

## Features

- **Customizable**: Binary or decimal units
- **Localization**: Custom separators and symbols
- **Flexible**: Multiple output formats
- **Round/Floor/Ceil**: Control rounding behavior
- **Full Numbers**: Option to show exact bytes

## Installation

```bash
elide install filesize-clone
```

## Quick Start

```typescript
import filesize from './filesize-clone.ts'

filesize(1024)
// => "1 KB"

filesize(1024, { base: 10 })
// => "1.02 kB"

filesize(1000, { base: 10 })
// => "1 kB"

filesize(1024 * 1024, { round: 0 })
// => "1 MB"

filesize(1024, { output: 'array' })
// => [1, "KB"]

filesize(1024, { output: 'object' })
// => { value: 1, symbol: "KB", exponent: 1 }
```

## API

### `filesize(bytes, options?)`

#### Options

```typescript
interface Options {
  base?: 2 | 10              // Binary (1024) or Decimal (1000)
  bits?: boolean             // Use bits instead of bytes
  output?: 'string' | 'array' | 'object'  // Output format
  round?: number             // Decimal places
  roundingMethod?: 'round' | 'floor' | 'ceil'
  separator?: string         // Thousands separator
  spacer?: string           // Space between number and symbol
  standard?: 'iec' | 'jedec' // Unit standard
  symbols?: object          // Custom symbols
  fullform?: boolean        // Use full unit names
  exponent?: number         // Force specific exponent
  locale?: string | boolean  // Use locale formatting
}
```

## Examples

```typescript
// Basic
filesize(1024)                           // "1 KB"
filesize(1024 * 1024)                    // "1 MB"
filesize(1024 * 1024 * 1024)             // "1 GB"

// Decimal (base 10)
filesize(1000, { base: 10 })             // "1 kB"
filesize(1000000, { base: 10 })          // "1 MB"

// Precision
filesize(1024, { round: 2 })             // "1.00 KB"
filesize(1500, { round: 1 })             // "1.5 KB"

// Rounding method
filesize(1024.9, { roundingMethod: 'ceil' })   // "2 KB"
filesize(1024.9, { roundingMethod: 'floor' })  // "1 KB"

// Bits
filesize(1024, { bits: true })           // "1 Kbit"

// Full form
filesize(1024, { fullform: true })       // "1 kilobyte"

// Output formats
filesize(1024, { output: 'array' })      // [1, "KB"]
filesize(1024, { output: 'object' })     // { value: 1, symbol: "KB", ... }

// Locale
filesize(1234567, { locale: 'de' })      // "1,18 MB"

// Custom separator
filesize(1234567, { separator: ',' })    // "1,18 MB"

// Force exponent
filesize(1024, { exponent: 2 })          // "0.001 GB"
```

## Standards

- **IEC** (default): Binary units (KiB, MiB, GiB)
- **JEDEC**: Binary units (KB, MB, GB)

## License

MIT
