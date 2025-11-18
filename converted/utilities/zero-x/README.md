# 0x - Flamegraph Profiler

**Pure TypeScript implementation of 0x flamegraph profiler for Elide.**

Based on [0x](https://www.npmjs.com/package/0x) (~20K+ downloads/week)

## Features

- Flamegraph generation
- CPU profiling
- Stack trace analysis
- Hot path detection
- Performance visualization
- Zero dependencies (core)

## Installation

```bash
elide install @elide/zero-x
```

## Usage

### Profile a Function

```typescript
import { profileWithFlamegraph } from "./elide-zero-x.ts";

const result = await profileWithFlamegraph(
  () => {
    // Your code here
    processData();
  },
  { sampleInterval: 10 }
);

console.log("Hot paths:", result.hotPaths);
```

### Manual Profiling

```typescript
import { ZeroX } from "./elide-zero-x.ts";

const profiler = new ZeroX();

profiler.start({ sampleInterval: 10 });

// Collect samples during execution
const timer = setInterval(() => {
  profiler.collectSample();
}, 10);

// Run your code...
myApplication();

clearInterval(timer);

const result = profiler.stop();
```

### Analyze Hot Paths

```typescript
const result = await profileWithFlamegraph(myFunction);

result.hotPaths.forEach((path, i) => {
  console.log(`${i + 1}. ${path.percentage}% - ${path.path}`);
});
```

## Profile Result

```typescript
interface ProfileResult {
  samples: ProfileSample[];      // All collected samples
  flamegraph: FlamegraphNode;    // Flamegraph tree
  totalTime: number;             // Total profiling time
  hotPaths: Array<{              // Top hot paths
    path: string;
    percentage: number;
  }>;
}
```

## API Reference

### `new ZeroX()`

Create a new flamegraph profiler.

### `profiler.start(options?)`

Start profiling.

**Options:**
- `sampleInterval?: number` - Sampling interval in ms (default: 10)

### `profiler.collectSample()`

Manually collect a stack sample.

### `profiler.stop()`

Stop profiling and return results.

**Returns:** `ProfileResult`

### `profileWithFlamegraph(fn, options?)`

Profile a function and generate flamegraph.

**Returns:** `Promise<ProfileResult>`

## Output Example

```
🔥 0x flamegraph profiler started
  Sample interval: 10ms

🔥 Profiling stopped
  Collected 150 samples
  Total time: 1500.00ms

📊 Flamegraph Analysis
======================================================================

Top 10 Hot Paths:
----------------------------------------------------------------------
1. 45.23% - processData > fibonacci > fibonacci
2. 23.45% - processData > calculateSum
3. 12.34% - processData > sortArray
4. 8.76% - main > processData
...
----------------------------------------------------------------------
```

## Polyglot Benefits

Use the same flamegraph profiler across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One profiler everywhere!

## Performance

- **Zero dependencies** - Core functionality standalone
- **Visual profiling** - Flamegraph generation
- **Hot path detection** - Identify bottlenecks
- **20K+ downloads/week** - Industry tool

## License

MIT
