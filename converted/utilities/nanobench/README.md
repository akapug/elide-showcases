# nanobench - Minimal Benchmarking

**Pure TypeScript implementation of nanobench for Elide.**

Based on [nanobench](https://www.npmjs.com/package/nanobench) (~50K+ downloads/week)

## Features

- Minimal overhead benchmarking
- Statistical analysis
- Algorithm comparison
- Async support
- Zero dependencies

## Installation

```bash
elide install @elide/nanobench
```

## Usage

```typescript
import nanobench from './elide-nanobench.ts';

// Simple benchmark
await nanobench.bench('My operation', () => {
  // code to benchmark
}, 1000);

// Async benchmark
await nanobench.bench('Async operation', async () => {
  await someAsyncWork();
}, 100);

// Compare algorithms
await nanobench.compare([
  {
    name: 'Algorithm A',
    fn: () => { /* implementation A */ },
  },
  {
    name: 'Algorithm B',
    fn: () => { /* implementation B */ },
  },
], 1000);

// Quick benchmark
import { NanoBench } from './elide-nanobench.ts';
await NanoBench.quick('Quick test', () => {
  // code
}, 100);
```

## API Reference

### nanobench.bench(name, fn, iterations?)

Run a single benchmark.

**Parameters:**
- `name: string` - Benchmark name
- `fn: () => void | Promise<void>` - Function to benchmark
- `iterations?: number` - Number of iterations (default: 1000)

**Returns:** `Promise<BenchmarkResult>`

### nanobench.compare(benchmarks, iterations?)

Compare multiple benchmarks.

**Parameters:**
- `benchmarks: Array<{ name: string, fn: Function }>` - Benchmarks to compare
- `iterations?: number` - Iterations per benchmark (default: 1000)

### NanoBench.quick(name, fn, iterations?)

Run a quick benchmark (static method).

### BenchmarkResult

```typescript
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;     // Total time in ms
  avgTime: number;       // Average time per iteration
  minTime: number;       // Fastest iteration
  maxTime: number;       // Slowest iteration
  opsPerSec: number;     // Operations per second
  samples: number[];     // All timing samples
}
```

## Performance

- **50K+ downloads/week** - Lightweight benchmarking
- **Minimal overhead** - Accurate measurements

## License

MIT
