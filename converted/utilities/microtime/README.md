# microtime - Microsecond Timing

**Pure TypeScript implementation of microtime for Elide.**

Based on [microtime](https://www.npmjs.com/package/microtime) (~500K+ downloads/week)

## Features

- Microsecond precision timing
- Unix timestamp support
- Function measurement
- Async timing support
- Zero dependencies

## Installation

```bash
elide install @elide/microtime
```

## Usage

```typescript
import microtime from './elide-microtime.ts';

// Get current time
const micros = microtime.now();
const [seconds, microseconds] = microtime.nowDouble();
const fractional = microtime.nowStruct();

// Measure function
const { result, microseconds } = microtime.measure(() => {
  // your code
  return 'result';
});

// Measure async function
const { result, microseconds } = await microtime.measureAsync(async () => {
  await someAsyncOperation();
  return 'result';
});

// Format time
console.log(microtime.format(microseconds));

// Convert units
const millis = microtime.toMillis(microseconds);
const seconds = microtime.toSeconds(microseconds);
```

## API Reference

### microtime.now()

Get current time in microseconds since Unix epoch.

**Returns:** `number` - Microseconds

### microtime.nowDouble()

Get current time as `[seconds, microseconds]`.

**Returns:** `[number, number]`

### microtime.nowStruct()

Get current time as seconds with fractional microseconds.

**Returns:** `number`

### microtime.measure(fn)

Measure synchronous function execution time.

**Returns:** `{ result: T, microseconds: number }`

### microtime.measureAsync(fn)

Measure asynchronous function execution time.

**Returns:** `Promise<{ result: T, microseconds: number }>`

### microtime.sleep(microseconds)

Sleep for specified microseconds.

### microtime.toMillis(microseconds)

Convert microseconds to milliseconds.

### microtime.toSeconds(microseconds)

Convert microseconds to seconds.

### microtime.format(microseconds)

Format microseconds as human-readable string.

## Performance

- **500K+ downloads/week** - Popular timing library
- **Microsecond precision** - High-resolution timing

## License

MIT
