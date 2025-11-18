# Process HRTime - High-Resolution Time

**Pure TypeScript implementation of process.hrtime for Elide.**

Based on [process-hrtime](https://www.npmjs.com/package/process-hrtime) (~20K+ downloads/week)

## Features

- Nanosecond precision timing
- process.hrtime compatibility
- Monotonic clock
- Time difference calculation
- BigInt support
- Zero dependencies

## Installation

```bash
elide install @elide/process-hrtime
```

## Usage

### Basic HRTime

```typescript
import { hrtime } from "./elide-process-hrtime.ts";

const start = hrtime();
// [seconds, nanoseconds]
console.log(start); // [1234, 567890000]
```

### Measure Elapsed Time

```typescript
import { hrtime, hrtimeToMs } from "./elide-process-hrtime.ts";

const start = hrtime();

// Do some work...
for (let i = 0; i < 1_000_000; i++) {
  // work
}

const elapsed = hrtime(start);
console.log("Elapsed:", hrtimeToMs(elapsed), "ms");
```

### BigInt Support

```typescript
import { hrtimeBigInt } from "./elide-process-hrtime.ts";

const start = hrtimeBigInt();
// Do work...
const elapsed = hrtimeBigInt(start);
console.log("Elapsed:", elapsed, "nanoseconds");
```

### Convert Time Units

```typescript
import { hrtime, hrtimeToMs, hrtimeToMicros, hrtimeToNanos } from "./elide-process-hrtime.ts";

const time = hrtime();

console.log(hrtimeToMs(time), "ms");      // Milliseconds
console.log(hrtimeToMicros(time), "μs");  // Microseconds
console.log(hrtimeToNanos(time), "ns");   // Nanoseconds
```

### Benchmark Helper

```typescript
import { hrtime, hrtimeToMs } from "./elide-process-hrtime.ts";

function benchmark(name: string, fn: () => void) {
  const start = hrtime();
  fn();
  const elapsed = hrtime(start);
  console.log(`${name}: ${hrtimeToMs(elapsed)}ms`);
}

benchmark("Array creation", () => {
  const arr = new Array(100_000).fill(0);
});
```

## API Reference

### `hrtime(previousTime?: HRTime): HRTime`

Get high-resolution time as `[seconds, nanoseconds]` tuple.

- If `previousTime` is provided, returns the difference
- Compatible with Node.js `process.hrtime()`

### `hrtimeBigInt(previousTime?: bigint): bigint`

Get high-resolution time as bigint (nanoseconds).

- If `previousTime` is provided, returns the difference
- Compatible with Node.js `process.hrtime.bigint()`

### `hrtimeToMs(hrtime: HRTime): number`

Convert hrtime tuple to milliseconds.

### `hrtimeToMicros(hrtime: HRTime): number`

Convert hrtime tuple to microseconds.

### `hrtimeToNanos(hrtime: HRTime): number`

Convert hrtime tuple to nanoseconds.

## Polyglot Benefits

Use the same high-resolution timing library across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One timing library everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **Nanosecond precision** - High-resolution timing
- **Monotonic clock** - Never goes backwards
- **20K+ downloads/week** - Reliable utility

## License

MIT
