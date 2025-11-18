# Memory Usage - Memory Statistics Tracking

**Pure TypeScript implementation of memory usage tracking for Elide.**

Based on [memory-usage](https://www.npmjs.com/package/memory-usage) (~5K+ downloads/week)

## Features

- Real-time memory tracking
- Memory snapshots
- Delta calculations
- Memory leak detection
- Formatted output
- Zero dependencies

## Installation

```bash
elide install @elide/memory-usage
```

## Usage

### Current Memory

```typescript
import memoryUsage from "./elide-memory-usage.ts";

const stats = memoryUsage.current();
console.log("Heap used:", stats.heapUsed);
```

### Track Memory Delta

```typescript
import memoryUsage, { MemoryUsage } from "./elide-memory-usage.ts";

memoryUsage.start();

// Run code...
doWork();

const delta = memoryUsage.stop();
MemoryUsage.printDelta(delta);
```

### Memory Snapshots

```typescript
const snap1 = memoryUsage.snapshot();

// Allocate memory...
const data = [];

const snap2 = memoryUsage.snapshot();
const diff = memoryUsage.delta(snap1, snap2);

console.log("Memory growth:", MemoryUsage.format(diff.heapUsed));
```

### Memory Leak Detection

```typescript
const baseline = memoryUsage.current();

for (let i = 0; i < 10; i++) {
  // Do work...

  const check = memoryUsage.current();
  const growth = check.heapUsed - baseline.heapUsed;

  if (growth > 10 * 1024 * 1024) { // 10MB
    console.warn("Memory leak detected!");
  }
}
```

### Format Memory

```typescript
import { MemoryUsage } from "./elide-memory-usage.ts";

console.log(MemoryUsage.format(1024));          // "1.00 KB"
console.log(MemoryUsage.format(1024 * 1024));   // "1.00 MB"
console.log(MemoryUsage.format(1024 * 1024 * 1024)); // "1.00 GB"
```

## API Reference

### `memoryUsage.current()`

Get current memory statistics.

**Returns:** `MemoryStats`

### `memoryUsage.snapshot()`

Take memory snapshot.

**Returns:** `MemoryStats`

### `memoryUsage.start()`

Start tracking memory.

**Returns:** `MemoryStats`

### `memoryUsage.stop()`

Stop tracking and get delta.

**Returns:** `MemoryDelta | null`

### `memoryUsage.delta(start, end)`

Calculate delta between snapshots.

**Returns:** `MemoryDelta`

### `MemoryUsage.format(bytes)`

Format bytes to human-readable string.

**Returns:** `string`

### `MemoryUsage.print(stats)`

Print memory statistics.

### `MemoryUsage.printDelta(delta)`

Print memory delta.

## Types

```typescript
interface MemoryStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

interface MemoryDelta {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  duration: number;
}
```

## Polyglot Benefits

Use memory tracking across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One memory tracker everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Real-time** - Instant metrics
- **Lightweight** - Minimal overhead
- **5K+ downloads/week** - Reliable tool

## License

MIT
