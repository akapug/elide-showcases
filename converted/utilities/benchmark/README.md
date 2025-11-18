# Benchmark - Robust Benchmarking Library

**Pure TypeScript implementation of Benchmark.js for Elide.**

Based on [benchmark](https://www.npmjs.com/package/benchmark) (~2M+ downloads/week)

## Features

- High-resolution timing
- Statistical analysis
- Compare multiple benchmarks
- Async support
- Suite management
- Zero dependencies

## Installation

```bash
elide install @elide/benchmark
```

## Usage

### Single Benchmark

```typescript
import { Benchmark } from "./elide-benchmark.ts";

const bench = new Benchmark({
  name: "String concatenation",
  fn: () => {
    let str = "";
    for (let i = 0; i < 100; i++) {
      str += "a";
    }
  },
});

await bench.run();
console.log(bench.toString());
// "String concatenation x 1,234,567 ops/sec ±1.23% (50 runs sampled)"
```

### Benchmark Suite

```typescript
import { Suite } from "./elide-benchmark.ts";

const suite = new Suite("Array methods");

suite
  .add("for loop", () => {
    const arr = [1, 2, 3, 4, 5];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
  })
  .add("forEach", () => {
    const arr = [1, 2, 3, 4, 5];
    let sum = 0;
    arr.forEach((n) => (sum += n));
  })
  .add("reduce", () => {
    const arr = [1, 2, 3, 4, 5];
    arr.reduce((a, b) => a + b, 0);
  });

await suite.run();
```

### Setup and Teardown

```typescript
const bench = new Benchmark({
  name: "With setup/teardown",
  setup: () => {
    // Run before each cycle
    console.log("Setup");
  },
  fn: () => {
    // Benchmark code
  },
  teardown: () => {
    // Run after each cycle
    console.log("Teardown");
  },
});
```

### Async Benchmarks

```typescript
const bench = new Benchmark({
  name: "Async operation",
  fn: async () => {
    await someAsyncOperation();
  },
});

await bench.run();
```

### Custom Options

```typescript
const bench = new Benchmark({
  name: "Custom options",
  fn: () => {
    // Benchmark code
  },
  minSamples: 10,    // Minimum number of samples
  maxTime: 10000,    // Maximum time in ms
});
```

## Output Format

```
Running: String concatenation...
String concatenation x 1,234,567 ops/sec ±1.23% (50 runs sampled)
```

### Suite Output

```
=== Array methods ===

Running: for loop...
for loop x 12,345,678 ops/sec ±0.98% (52 runs sampled)
Running: forEach...
forEach x 8,234,567 ops/sec ±1.45% (48 runs sampled)
Running: reduce...
reduce x 9,123,456 ops/sec ±1.12% (51 runs sampled)

Fastest is for loop

Relative performance:
  for loop: baseline
  forEach: 1.50x slower (50.0% slower)
  reduce: 1.35x slower (35.3% slower)
```

## Statistics

Each benchmark provides detailed statistics:

```typescript
bench.stats = {
  mean: 1234567,      // Mean ops/sec
  variance: 12345,    // Variance
  stdDev: 111,        // Standard deviation
  rme: 1.23,          // Relative margin of error %
  sem: 11.1,          // Standard error of mean
  min: 1200000,       // Minimum ops/sec
  max: 1300000,       // Maximum ops/sec
  samples: 50,        // Number of samples
};
```

## Polyglot Benefits

Use the same benchmarking library across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One performance testing framework everywhere!

## API Reference

### Benchmark

- `new Benchmark(options)` - Create benchmark
  - `options.name` - Benchmark name
  - `options.fn` - Function to benchmark
  - `options.setup` - Setup function
  - `options.teardown` - Teardown function
  - `options.minSamples` - Min samples (default: 5)
  - `options.maxTime` - Max time in ms (default: 5000)
- `bench.run()` - Run benchmark
- `bench.toString()` - Get formatted result
- `bench.hz` - Operations per second
- `bench.stats` - Statistics object

### Suite

- `new Suite(name?)` - Create suite
- `suite.add(name, fn)` - Add benchmark
- `suite.run()` - Run all benchmarks

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **High-resolution timing** - Uses performance.now()
- **Statistical analysis** - Mean, variance, std dev, RME
- **2M+ downloads/week** - Industry standard

## License

MIT
