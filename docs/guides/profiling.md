# Performance Profiling Guide

**Comprehensive guide to profiling and optimizing Elide applications**

Learn how to identify performance bottlenecks, measure execution time, and optimize your polyglot applications.

---

## Table of Contents

- [Profiling Overview](#profiling-overview)
- [Timing and Benchmarking](#timing-and-benchmarking)
- [Memory Profiling](#memory-profiling)
- [HTTP Performance](#http-performance)
- [Polyglot Performance](#polyglot-performance)
- [Bottleneck Identification](#bottleneck-identification)
- [Optimization Strategies](#optimization-strategies)

---

## Profiling Overview

### Why Profile?

- **Identify bottlenecks**: Find slow code paths
- **Optimize resources**: Reduce CPU and memory usage
- **Improve response times**: Make applications faster
- **Cost reduction**: Lower infrastructure costs
- **Better UX**: Faster applications = happier users

### Profiling Process

1. **Baseline**: Measure current performance
2. **Profile**: Identify bottlenecks
3. **Hypothesize**: Form theories about causes
4. **Optimize**: Apply targeted improvements
5. **Measure**: Verify improvements
6. **Repeat**: Continue optimizing

---

## Timing and Benchmarking

### Simple Timing

```typescript
// Simple timing with Date
const start = Date.now();
const result = expensiveOperation();
const duration = Date.now() - start;
console.log(`Operation took ${duration}ms`);

// High-precision timing with performance.now()
const preciseStart = performance.now();
const result2 = expensiveOperation();
const preciseDuration = performance.now() - preciseStart;
console.log(`Operation took ${preciseDuration.toFixed(3)}ms`);
```

### Timing Helper

```typescript
// timer.ts
export class Timer {
  private start: number;

  constructor() {
    this.start = performance.now();
  }

  elapsed(): number {
    return performance.now() - this.start;
  }

  reset(): void {
    this.start = performance.now();
  }

  lap(): number {
    const elapsed = this.elapsed();
    this.reset();
    return elapsed;
  }
}

// Usage
const timer = new Timer();

doStep1();
console.log(`Step 1: ${timer.lap().toFixed(2)}ms`);

doStep2();
console.log(`Step 2: ${timer.lap().toFixed(2)}ms`);

doStep3();
console.log(`Step 3: ${timer.lap().toFixed(2)}ms`);
console.log(`Total: ${timer.elapsed().toFixed(2)}ms`);
```

### Benchmarking Framework

```typescript
// benchmark.ts
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

export class Benchmark {
  async run(
    name: string,
    fn: () => any,
    iterations: number = 1000
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warmup
    for (let i = 0; i < Math.min(100, iterations / 10); i++) {
      fn();
    }

    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const duration = performance.now() - start;
      times.push(duration);
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / avgTime;

    return {
      name,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      opsPerSecond
    };
  }

  async compare(benchmarks: Array<{ name: string; fn: () => any }>, iterations: number = 1000) {
    console.log(`\nRunning ${benchmarks.length} benchmarks with ${iterations} iterations each...\n`);

    const results: BenchmarkResult[] = [];

    for (const bench of benchmarks) {
      const result = await this.run(bench.name, bench.fn, iterations);
      results.push(result);

      console.log(`${bench.name}:`);
      console.log(`  Avg: ${result.avgTime.toFixed(4)}ms`);
      console.log(`  Min: ${result.minTime.toFixed(4)}ms`);
      console.log(`  Max: ${result.maxTime.toFixed(4)}ms`);
      console.log(`  Ops/sec: ${Math.round(result.opsPerSecond).toLocaleString()}`);
      console.log();
    }

    // Find fastest
    const fastest = results.reduce((min, r) => r.avgTime < min.avgTime ? r : min);

    console.log("Comparison:");
    for (const result of results) {
      const ratio = result.avgTime / fastest.avgTime;
      console.log(`  ${result.name}: ${ratio.toFixed(2)}x ${ratio > 1 ? 'slower' : 'faster'}`);
    }
  }
}

// Usage
const benchmark = new Benchmark();

await benchmark.compare([
  {
    name: "Array.map()",
    fn: () => [1, 2, 3, 4, 5].map(x => x * 2)
  },
  {
    name: "for loop",
    fn: () => {
      const arr = [1, 2, 3, 4, 5];
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        result.push(arr[i] * 2);
      }
      return result;
    }
  },
  {
    name: "forEach",
    fn: () => {
      const result: number[] = [];
      [1, 2, 3, 4, 5].forEach(x => result.push(x * 2));
      return result;
    }
  }
], 10000);
```

---

## Memory Profiling

### Memory Usage Tracking

```typescript
// memory-profiler.ts
export interface MemorySnapshot {
  timestamp: number;
  rss: number;        // Resident Set Size
  heapTotal: number;  // Total heap size
  heapUsed: number;   // Used heap size
  external: number;   // C++ objects bound to JS
  arrayBuffers: number;
}

export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];

  snapshot(): MemorySnapshot {
    const usage = process.memoryUsage();

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external || 0,
      arrayBuffers: usage.arrayBuffers || 0
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  formatBytes(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  printSnapshot(snapshot: MemorySnapshot): void {
    console.log("\n=== Memory Snapshot ===");
    console.log(`Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
    console.log(`RSS: ${this.formatBytes(snapshot.rss)}`);
    console.log(`Heap Total: ${this.formatBytes(snapshot.heapTotal)}`);
    console.log(`Heap Used: ${this.formatBytes(snapshot.heapUsed)}`);
    console.log(`External: ${this.formatBytes(snapshot.external)}`);
    console.log(`Array Buffers: ${this.formatBytes(snapshot.arrayBuffers)}`);
    console.log("=======================\n");
  }

  compare(before: MemorySnapshot, after: MemorySnapshot): void {
    console.log("\n=== Memory Comparison ===");
    console.log(`RSS: ${this.formatBytes(after.rss - before.rss)} ${after.rss > before.rss ? '↑' : '↓'}`);
    console.log(`Heap Used: ${this.formatBytes(after.heapUsed - before.heapUsed)} ${after.heapUsed > before.heapUsed ? '↑' : '↓'}`);
    console.log("=========================\n");
  }

  getSnapshots(): MemorySnapshot[] {
    return this.snapshots;
  }

  clear(): void {
    this.snapshots = [];
  }
}

// Usage
const profiler = new MemoryProfiler();

// Before operation
const before = profiler.snapshot();
profiler.printSnapshot(before);

// Run operation
const largeArray = new Array(1000000).fill({ data: "test" });

// After operation
const after = profiler.snapshot();
profiler.printSnapshot(after);

// Compare
profiler.compare(before, after);
```

### Memory Leak Detection

```typescript
// leak-detector.ts
export class LeakDetector {
  private baseline: MemorySnapshot | null = null;
  private profiler = new MemoryProfiler();

  setBaseline(): void {
    // Take multiple snapshots to establish baseline
    for (let i = 0; i < 5; i++) {
      this.profiler.snapshot();
    }

    const snapshots = this.profiler.getSnapshots();
    const avgHeapUsed = snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / snapshots.length;

    this.baseline = {
      timestamp: Date.now(),
      rss: 0,
      heapTotal: 0,
      heapUsed: avgHeapUsed,
      external: 0,
      arrayBuffers: 0
    };

    console.log(`Baseline set: ${this.profiler.formatBytes(avgHeapUsed)}`);
  }

  check(): boolean {
    if (!this.baseline) {
      throw new Error("Baseline not set");
    }

    const current = this.profiler.snapshot();
    const growth = current.heapUsed - this.baseline.heapUsed;
    const growthPercent = (growth / this.baseline.heapUsed) * 100;

    console.log(`Memory growth: ${this.profiler.formatBytes(growth)} (${growthPercent.toFixed(2)}%)`);

    // Consider > 50% growth a potential leak
    return growthPercent > 50;
  }
}

// Usage
const detector = new LeakDetector();
detector.setBaseline();

// Run operations
for (let i = 0; i < 100; i++) {
  // Your operations here
}

if (detector.check()) {
  console.warn("Potential memory leak detected!");
}
```

---

## HTTP Performance

### Request Profiling

```typescript
// http-profiler.ts
interface RequestProfile {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  phases: {
    [key: string]: number;
  };
}

export class HTTPProfiler {
  private profiles: RequestProfile[] = [];

  createProfile(req: Request): {
    finish: (status: number) => RequestProfile;
    phase: (name: string) => void;
  } {
    const requestId = req.headers.get("X-Request-ID") || `req-${Date.now()}`;
    const url = new URL(req.url);

    const profile: RequestProfile = {
      requestId,
      method: req.method,
      path: url.pathname,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      status: 0,
      phases: {}
    };

    let lastPhaseTime = profile.startTime;

    return {
      phase: (name: string) => {
        const now = performance.now();
        profile.phases[name] = now - lastPhaseTime;
        lastPhaseTime = now;
      },

      finish: (status: number) => {
        profile.endTime = performance.now();
        profile.duration = profile.endTime - profile.startTime;
        profile.status = status;

        this.profiles.push(profile);
        return profile;
      }
    };
  }

  getStats() {
    if (this.profiles.length === 0) {
      return null;
    }

    const durations = this.profiles.map(p => p.duration);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: this.profiles.length,
      avg: avg.toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      p50: sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
      p95: sorted[Math.floor(sorted.length * 0.95)].toFixed(2),
      p99: sorted[Math.floor(sorted.length * 0.99)].toFixed(2)
    };
  }

  printStats(): void {
    const stats = this.getStats();

    if (!stats) {
      console.log("No requests profiled");
      return;
    }

    console.log("\n=== HTTP Performance Stats ===");
    console.log(`Requests: ${stats.count}`);
    console.log(`Average: ${stats.avg}ms`);
    console.log(`Min: ${stats.min}ms`);
    console.log(`Max: ${stats.max}ms`);
    console.log(`P50: ${stats.p50}ms`);
    console.log(`P95: ${stats.p95}ms`);
    console.log(`P99: ${stats.p99}ms`);
    console.log("==============================\n");
  }
}

// Usage
const httpProfiler = new HTTPProfiler();

export default async function fetch(req: Request): Promise<Response> {
  const { phase, finish } = httpProfiler.createProfile(req);

  phase("auth");
  // Authentication logic
  await authenticate(req);

  phase("processing");
  // Business logic
  const result = await handleRequest(req);

  phase("response");
  const response = new Response(JSON.stringify(result));

  const profile = finish(response.status);

  // Log slow requests
  if (profile.duration > 1000) {
    console.warn(`Slow request: ${profile.method} ${profile.path} (${profile.duration.toFixed(2)}ms)`);
    console.log("Phases:", profile.phases);
  }

  return response;
}
```

### Throughput Testing

```typescript
// throughput-test.ts
export async function testThroughput(
  url: string,
  concurrency: number = 10,
  duration: number = 10000
) {
  const startTime = Date.now();
  const results: number[] = [];
  let totalRequests = 0;
  let errors = 0;

  console.log(`Testing ${url} with ${concurrency} concurrent requests for ${duration}ms...`);

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() - startTime < duration) {
      const reqStart = performance.now();

      try {
        const response = await fetch(url);
        const reqDuration = performance.now() - reqStart;

        results.push(reqDuration);
        totalRequests++;

        if (!response.ok) {
          errors++;
        }
      } catch (error) {
        errors++;
      }
    }
  });

  await Promise.all(workers);

  const actualDuration = Date.now() - startTime;
  const requestsPerSecond = (totalRequests / actualDuration) * 1000;

  const sorted = [...results].sort((a, b) => a - b);
  const avg = results.reduce((sum, r) => sum + r, 0) / results.length;

  console.log("\n=== Throughput Test Results ===");
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Errors: ${errors}`);
  console.log(`Duration: ${actualDuration}ms`);
  console.log(`Requests/sec: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Average latency: ${avg.toFixed(2)}ms`);
  console.log(`P50: ${sorted[Math.floor(sorted.length * 0.5)].toFixed(2)}ms`);
  console.log(`P95: ${sorted[Math.floor(sorted.length * 0.95)].toFixed(2)}ms`);
  console.log(`P99: ${sorted[Math.floor(sorted.length * 0.99)].toFixed(2)}ms`);
  console.log("================================\n");
}

// Usage
await testThroughput("http://localhost:3000/api/test", 10, 10000);
```

---

## Polyglot Performance

### Cross-Language Call Profiling

```typescript
// polyglot-profiler.ts
export function profilePolyglotCall<T>(
  languageName: string,
  functionName: string,
  fn: (...args: any[]) => T,
  ...args: any[]
): T {
  const start = performance.now();

  try {
    const result = fn(...args);
    const duration = performance.now() - start;

    console.log(`[POLYGLOT] ${languageName}.${functionName}: ${duration.toFixed(3)}ms`);

    // Warn if cross-language call is slow
    if (duration > 1) {
      console.warn(`[POLYGLOT] Slow cross-language call: ${duration.toFixed(3)}ms`);
    }

    return result;

  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[POLYGLOT] ${languageName}.${functionName} failed after ${duration.toFixed(3)}ms`);
    throw error;
  }
}

// Usage
import { pythonFunction } from "./module.py";

const result = profilePolyglotCall("Python", "processData", pythonFunction, data);
```

---

## Bottleneck Identification

### Hot Path Analysis

```typescript
// hot-path-profiler.ts
export class HotPathProfiler {
  private callCounts: Map<string, number> = new Map();
  private callTimes: Map<string, number[]> = new Map();

  profile<T>(name: string, fn: () => T): T {
    // Count calls
    this.callCounts.set(name, (this.callCounts.get(name) || 0) + 1);

    // Measure time
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    // Store time
    if (!this.callTimes.has(name)) {
      this.callTimes.set(name, []);
    }
    this.callTimes.get(name)!.push(duration);

    return result;
  }

  getHotPaths(topN: number = 10) {
    const paths = Array.from(this.callCounts.entries()).map(([name, count]) => {
      const times = this.callTimes.get(name) || [];
      const totalTime = times.reduce((sum, t) => sum + t, 0);
      const avgTime = totalTime / count;

      return {
        name,
        count,
        totalTime,
        avgTime,
        score: totalTime * count  // Impact score
      };
    });

    return paths
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  printReport(): void {
    console.log("\n=== Hot Path Analysis ===");

    const hotPaths = this.getHotPaths();

    for (const path of hotPaths) {
      console.log(`\n${path.name}:`);
      console.log(`  Calls: ${path.count}`);
      console.log(`  Total time: ${path.totalTime.toFixed(2)}ms`);
      console.log(`  Avg time: ${path.avgTime.toFixed(2)}ms`);
      console.log(`  Impact score: ${path.score.toFixed(0)}`);
    }

    console.log("\n========================\n");
  }
}

// Usage
const profiler = new HotPathProfiler();

// Instrument hot paths
function processItem(item: any) {
  return profiler.profile("processItem", () => {
    // Processing logic
    return item;
  });
}

function validateItem(item: any) {
  return profiler.profile("validateItem", () => {
    // Validation logic
    return true;
  });
}

// After running
profiler.printReport();
```

---

## Optimization Strategies

### 1. Memoization

```typescript
// memoize.ts
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

// Usage
const expensiveFunction = memoize((n: number) => {
  // Expensive calculation
  return n * n;
});

console.time("first call");
expensiveFunction(100);  // Calculates
console.timeEnd("first call");

console.time("second call");
expensiveFunction(100);  // Returns cached
console.timeEnd("second call");
```

### 2. Batch Processing

```typescript
// ❌ Bad - Process one at a time
for (const item of items) {
  await processItem(item);  // Network call for each
}

// ✅ Good - Batch process
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await processBatch(batch);  // One network call
}
```

### 3. Lazy Loading

```typescript
// ❌ Bad - Load everything upfront
const data = await fetchAllData();  // 10MB

// ✅ Good - Load on demand
let data: any = null;

async function getData() {
  if (!data) {
    data = await fetchAllData();
  }
  return data;
}
```

---

## Next Steps

- **[Performance Optimization](./performance-optimization.md)** - Apply optimizations
- **[Debugging](./debugging.md)** - Debug performance issues
- **[Testing](./testing.md)** - Performance regression tests
- **[Deployment](./deployment.md)** - Production monitoring

---

## Summary

**Profiling Tools:**

- ✅ **Timing**: Measure execution time
- ✅ **Memory**: Track memory usage
- ✅ **HTTP**: Profile request performance
- ✅ **Polyglot**: Measure cross-language calls
- ✅ **Hot Paths**: Identify bottlenecks

**Optimization Strategies:**

1. Profile before optimizing
2. Focus on hot paths
3. Use memoization for expensive calculations
4. Batch network/database calls
5. Implement lazy loading
6. Cache frequently accessed data
7. Minimize cross-language calls in hot paths

**Performance Goals:**

- HTTP requests: < 100ms P95
- Cross-language calls: < 1ms
- Memory growth: < 50% over time
- Throughput: > 1000 req/s (single core)

🚀 **Profile, optimize, and achieve peak performance!**
