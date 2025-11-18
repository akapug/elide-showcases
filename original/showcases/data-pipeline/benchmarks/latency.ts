/**
 * Latency Benchmarks
 *
 * Performance benchmarks for streaming pipeline:
 * - End-to-end latency
 * - Processing throughput
 * - Transformation overhead
 * - Aggregation performance
 * - Memory usage
 * - Backpressure handling
 */

import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  memoryUsed: number;
}

export interface BenchmarkConfig {
  warmupIterations: number;
  benchmarkIterations: number;
  dataSize: number;
}

// ============================================================================
// Benchmark Framework
// ============================================================================

class Benchmark {
  private name: string;
  private fn: () => Promise<void> | void;
  private config: BenchmarkConfig;

  constructor(name: string, fn: () => Promise<void> | void, config?: Partial<BenchmarkConfig>) {
    this.name = name;
    this.fn = fn;
    this.config = {
      warmupIterations: 100,
      benchmarkIterations: 1000,
      dataSize: 1000,
      ...config
    };
  }

  public async run(): Promise<BenchmarkResult> {
    console.log(`\nRunning benchmark: ${this.name}`);

    // Warmup
    console.log('  Warming up...');
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await this.fn();
    }

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = process.memoryUsage();

    // Benchmark
    console.log('  Benchmarking...');
    const latencies: number[] = [];
    const startTime = Date.now();

    for (let i = 0; i < this.config.benchmarkIterations; i++) {
      const opStart = Date.now();
      await this.fn();
      const opEnd = Date.now();
      latencies.push(opEnd - opStart);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const memoryAfter = process.memoryUsage();
    const memoryUsed = memoryAfter.heapUsed - memoryBefore.heapUsed;

    // Calculate statistics
    latencies.sort((a, b) => a - b);

    const result: BenchmarkResult = {
      name: this.name,
      duration,
      operations: this.config.benchmarkIterations,
      opsPerSecond: (this.config.benchmarkIterations / duration) * 1000,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: latencies[0],
      maxLatency: latencies[latencies.length - 1],
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      memoryUsed
    };

    this.printResult(result);
    return result;
  }

  private printResult(result: BenchmarkResult): void {
    console.log('  Results:');
    console.log(`    Operations: ${result.operations}`);
    console.log(`    Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`    Throughput: ${result.opsPerSecond.toFixed(2)} ops/sec`);
    console.log(`    Avg Latency: ${result.avgLatency.toFixed(3)}ms`);
    console.log(`    Min Latency: ${result.minLatency.toFixed(3)}ms`);
    console.log(`    Max Latency: ${result.maxLatency.toFixed(3)}ms`);
    console.log(`    P50 Latency: ${result.p50Latency.toFixed(3)}ms`);
    console.log(`    P95 Latency: ${result.p95Latency.toFixed(3)}ms`);
    console.log(`    P99 Latency: ${result.p99Latency.toFixed(3)}ms`);
    console.log(`    Memory Used: ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  }
}

// ============================================================================
// Test Data Generators
// ============================================================================

function generateSmallMessage(): any {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    value: Math.random() * 100
  };
}

function generateMediumMessage(): any {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    user: {
      id: Math.floor(Math.random() * 10000),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`
    },
    data: {
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      value: Math.random() * 1000,
      tags: ['tag1', 'tag2', 'tag3']
    },
    metadata: {
      source: 'stream',
      version: '1.0'
    }
  };
}

function generateLargeMessage(): any {
  const items = [];
  for (let i = 0; i < 100; i++) {
    items.push({
      id: i,
      value: Math.random() * 100,
      description: `Item ${i} with some description text`
    });
  }

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    user: {
      id: Math.floor(Math.random() * 10000),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      }
    },
    items,
    metadata: {
      source: 'stream',
      version: '1.0',
      tags: Array(20).fill(0).map((_, i) => `tag${i}`)
    }
  };
}

// ============================================================================
// Serialization Benchmarks
// ============================================================================

function jsonSerialization(data: any): void {
  const serialized = JSON.stringify(data);
  const deserialized = JSON.parse(serialized);
}

function bufferSerialization(data: any): void {
  const json = JSON.stringify(data);
  const buffer = Buffer.from(json, 'utf8');
  const decoded = buffer.toString('utf8');
  JSON.parse(decoded);
}

// ============================================================================
// Transformation Benchmarks
// ============================================================================

function simpleTransform(data: any): any {
  return {
    ...data,
    processed: true,
    processedAt: Date.now()
  };
}

function complexTransform(data: any): any {
  const result = { ...data };

  // Deep clone
  if (result.user) {
    result.user = { ...result.user };
  }

  if (result.data) {
    result.data = { ...result.data };
  }

  // Add computed fields
  result.hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  result.processed = true;
  result.processedAt = Date.now();

  return result;
}

function mapTransform(data: any): any {
  const mapped: any = {};

  // Field mapping
  const fieldMap: Record<string, string> = {
    id: 'identifier',
    timestamp: 'ts',
    value: 'val'
  };

  for (const [oldKey, newKey] of Object.entries(fieldMap)) {
    if (oldKey in data) {
      mapped[newKey] = data[oldKey];
    }
  }

  return mapped;
}

// ============================================================================
// Aggregation Benchmarks
// ============================================================================

function sumAggregation(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

function avgAggregation(values: number[]): number {
  const sum = values.reduce((sum, val) => sum + val, 0);
  return values.length > 0 ? sum / values.length : 0;
}

function percentileAggregation(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function groupByAggregation(data: any[], groupField: string): Map<any, any[]> {
  const groups = new Map<any, any[]>();

  for (const item of data) {
    const key = item[groupField];

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(item);
  }

  return groups;
}

// ============================================================================
// Window Benchmarks
// ============================================================================

class SimpleTumblingWindow {
  private windowSize: number;
  private windows: Map<number, any[]> = new Map();

  constructor(windowSize: number) {
    this.windowSize = windowSize;
  }

  public add(timestamp: number, data: any): void {
    const windowStart = Math.floor(timestamp / this.windowSize) * this.windowSize;

    if (!this.windows.has(windowStart)) {
      this.windows.set(windowStart, []);
    }

    this.windows.get(windowStart)!.push(data);
  }

  public getWindow(windowStart: number): any[] {
    return this.windows.get(windowStart) || [];
  }
}

// ============================================================================
// Run Benchmarks
// ============================================================================

export async function runBenchmarks(): Promise<BenchmarkResult[]> {
  console.log('='.repeat(60));
  console.log('STREAMING PIPELINE LATENCY BENCHMARKS');
  console.log('='.repeat(60));

  const results: BenchmarkResult[] = [];

  // Serialization Benchmarks
  console.log('\n--- Serialization Benchmarks ---');

  const smallMsg = generateSmallMessage();
  results.push(await new Benchmark(
    'JSON Serialization (Small)',
    () => jsonSerialization(smallMsg),
    { benchmarkIterations: 10000 }
  ).run());

  const mediumMsg = generateMediumMessage();
  results.push(await new Benchmark(
    'JSON Serialization (Medium)',
    () => jsonSerialization(mediumMsg),
    { benchmarkIterations: 10000 }
  ).run());

  const largeMsg = generateLargeMessage();
  results.push(await new Benchmark(
    'JSON Serialization (Large)',
    () => jsonSerialization(largeMsg),
    { benchmarkIterations: 5000 }
  ).run());

  results.push(await new Benchmark(
    'Buffer Serialization (Medium)',
    () => bufferSerialization(mediumMsg),
    { benchmarkIterations: 10000 }
  ).run());

  // Transformation Benchmarks
  console.log('\n--- Transformation Benchmarks ---');

  results.push(await new Benchmark(
    'Simple Transform',
    () => simpleTransform(mediumMsg),
    { benchmarkIterations: 10000 }
  ).run());

  results.push(await new Benchmark(
    'Complex Transform',
    () => complexTransform(mediumMsg),
    { benchmarkIterations: 10000 }
  ).run());

  results.push(await new Benchmark(
    'Map Transform',
    () => mapTransform(mediumMsg),
    { benchmarkIterations: 10000 }
  ).run());

  // Aggregation Benchmarks
  console.log('\n--- Aggregation Benchmarks ---');

  const values1000 = Array(1000).fill(0).map(() => Math.random() * 100);
  const values10000 = Array(10000).fill(0).map(() => Math.random() * 100);

  results.push(await new Benchmark(
    'Sum Aggregation (1K values)',
    () => sumAggregation(values1000),
    { benchmarkIterations: 5000 }
  ).run());

  results.push(await new Benchmark(
    'Sum Aggregation (10K values)',
    () => sumAggregation(values10000),
    { benchmarkIterations: 1000 }
  ).run());

  results.push(await new Benchmark(
    'Average Aggregation (1K values)',
    () => avgAggregation(values1000),
    { benchmarkIterations: 5000 }
  ).run());

  results.push(await new Benchmark(
    'P95 Aggregation (1K values)',
    () => percentileAggregation(values1000, 95),
    { benchmarkIterations: 1000 }
  ).run());

  // Group By Benchmark
  const groupData = Array(1000).fill(0).map(() => ({
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    value: Math.random() * 100
  }));

  results.push(await new Benchmark(
    'Group By Aggregation (1K items)',
    () => groupByAggregation(groupData, 'category'),
    { benchmarkIterations: 5000 }
  ).run());

  // Window Benchmarks
  console.log('\n--- Window Benchmarks ---');

  const window = new SimpleTumblingWindow(1000);
  let timestamp = 0;

  results.push(await new Benchmark(
    'Tumbling Window Insert',
    () => {
      window.add(timestamp++, { value: Math.random() });
    },
    { benchmarkIterations: 10000 }
  ).run());

  // End-to-End Pipeline Benchmark
  console.log('\n--- End-to-End Pipeline Benchmarks ---');

  results.push(await new Benchmark(
    'E2E: Generate → Transform → Serialize',
    () => {
      const msg = generateMediumMessage();
      const transformed = simpleTransform(msg);
      jsonSerialization(transformed);
    },
    { benchmarkIterations: 5000 }
  ).run());

  results.push(await new Benchmark(
    'E2E: Generate → Complex Transform → Serialize',
    () => {
      const msg = generateMediumMessage();
      const transformed = complexTransform(msg);
      jsonSerialization(transformed);
    },
    { benchmarkIterations: 5000 }
  ).run());

  // Memory Allocation Benchmark
  console.log('\n--- Memory Allocation Benchmarks ---');

  results.push(await new Benchmark(
    'Array Allocation (1K items)',
    () => {
      const arr = new Array(1000);
      for (let i = 0; i < 1000; i++) {
        arr[i] = { id: i, value: Math.random() };
      }
    },
    { benchmarkIterations: 5000 }
  ).run());

  results.push(await new Benchmark(
    'Map Allocation (1K items)',
    () => {
      const map = new Map();
      for (let i = 0; i < 1000; i++) {
        map.set(i, { id: i, value: Math.random() });
      }
    },
    { benchmarkIterations: 5000 }
  ).run());

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('BENCHMARK SUMMARY');
  console.log('='.repeat(60));

  // Sort by throughput
  const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);

  console.log('\nTop 5 by Throughput:');
  for (let i = 0; i < Math.min(5, sorted.length); i++) {
    const result = sorted[i];
    console.log(
      `  ${i + 1}. ${result.name}: ${result.opsPerSecond.toFixed(0)} ops/sec`
    );
  }

  // Sort by latency
  const sortedByLatency = [...results].sort((a, b) => a.avgLatency - b.avgLatency);

  console.log('\nTop 5 by Lowest Latency:');
  for (let i = 0; i < Math.min(5, sortedByLatency.length); i++) {
    const result = sortedByLatency[i];
    console.log(
      `  ${i + 1}. ${result.name}: ${result.avgLatency.toFixed(3)}ms`
    );
  }

  console.log('\n' + '='.repeat(60));

  return results;
}

// ============================================================================
// Main
// ============================================================================

if (require.main === module) {
  runBenchmarks()
    .then(() => {
      console.log('\nAll benchmarks completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Benchmark failed:', error);
      process.exit(1);
    });
}

export { Benchmark };
