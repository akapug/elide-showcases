# Pretty HRTime - Format High-Resolution Time

**Pure TypeScript implementation of pretty-hrtime for Elide.**

Based on [pretty-hrtime](https://www.npmjs.com/package/pretty-hrtime) (~100K+ downloads/week)

## Features

- Format hrtime tuples to human-readable strings
- Automatic unit selection (ns, μs, ms, s, m, h)
- Custom precision control
- Verbose mode
- Unit conversion utilities
- Zero dependencies

## Installation

```bash
elide install @elide/pretty-hrtime
```

## Usage

### Basic Formatting

```typescript
import prettyHrtime from "./elide-pretty-hrtime.ts";

console.log(prettyHrtime([0, 1234]));        // "1234 ns"
console.log(prettyHrtime([0, 123456]));      // "123.46 μs"
console.log(prettyHrtime([0, 123456789]));   // "123.46 ms"
console.log(prettyHrtime([1, 234567890]));   // "1.23 s"
```

### Custom Precision

```typescript
import prettyHrtime from "./elide-pretty-hrtime.ts";

const time = [1, 234567890];

console.log(prettyHrtime(time, { precision: 0 }));  // "1 s"
console.log(prettyHrtime(time, { precision: 2 }));  // "1.23 s"
console.log(prettyHrtime(time, { precision: 4 }));  // "1.2346 s"
```

### Verbose Mode

```typescript
import prettyHrtime from "./elide-pretty-hrtime.ts";

console.log(prettyHrtime([0, 1234], { verbose: true }));
// "1234 nanoseconds"

console.log(prettyHrtime([1, 0], { verbose: true }));
// "1.00 seconds"
```

### Custom Unit Formatting

```typescript
import { formatAs } from "./elide-pretty-hrtime.ts";

const time = [0, 123456789];

console.log(formatAs(time, "ns"));   // "123456789 ns"
console.log(formatAs(time, "μs"));   // "123456.79 μs"
console.log(formatAs(time, "ms"));   // "123.46 ms"
console.log(formatAs(time, "s"));    // "0.12 s"
```

### Benchmark Formatting

```typescript
import prettyHrtime from "./elide-pretty-hrtime.ts";

function benchmark(name: string, fn: () => void) {
  const start = process.hrtime();
  fn();
  const elapsed = process.hrtime(start);
  console.log(`${name}: ${prettyHrtime(elapsed)}`);
}

benchmark("Array creation", () => {
  const arr = new Array(100_000).fill(0);
});
```

### Unit Conversion

```typescript
import { toMs, toMicros, toNanos } from "./elide-pretty-hrtime.ts";

const time = [1, 500000000];

console.log(toNanos(time));    // 1500000000
console.log(toMicros(time));   // 1500000
console.log(toMs(time));       // 1500
```

## API Reference

### `prettyHrtime(hrtime, options?)`

Format hrtime tuple to human-readable string.

**Parameters:**
- `hrtime: [number, number]` - HRTime tuple [seconds, nanoseconds]
- `options.precision?: number` - Decimal precision (default: 2)
- `options.verbose?: boolean` - Use verbose units (default: false)

**Returns:** Formatted string

### `formatAs(hrtime, unit, precision?)`

Format hrtime in specific unit.

**Parameters:**
- `hrtime: [number, number]` - HRTime tuple
- `unit: "ns" | "μs" | "ms" | "s"` - Target unit
- `precision?: number` - Decimal precision (default: 2)

**Returns:** Formatted string

### `toMs(hrtime)`, `toMicros(hrtime)`, `toNanos(hrtime)`

Convert hrtime to numeric value in specified unit.

**Returns:** Number

## Output Examples

```
1234 ns
123.46 μs
123.46 ms
1.23 s
1.08 m
1.03 h
```

## Polyglot Benefits

Use the same time formatting library across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One formatter everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **Human-readable** - Automatic unit selection
- **Flexible** - Custom precision and verbose mode
- **100K+ downloads/week** - Industry standard

## License

MIT
