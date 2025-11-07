/**
 * Benchmark Tests
 * Performance benchmarks for the full-stack template
 */

class Benchmark {
  private results: Map<string, number[]> = new Map();

  async measure(name: string, fn: () => Promise<void>, iterations: number = 100): Promise<void> {
    const times: number[] = [];

    // Warmup
    await fn();

    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    this.results.set(name, times);
  }

  getStats(name: string): {
    min: number;
    max: number;
    avg: number;
    median: number;
    p95: number;
    p99: number;
  } | null {
    const times = this.results.get(name);
    if (!times || times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  printResults(): void {
    console.log('\n📊 Benchmark Results\n');
    console.log('='.repeat(80));

    for (const [name, _] of this.results) {
      const stats = this.getStats(name);
      if (!stats) continue;

      console.log(`\n${name}:`);
      console.log(`  Min:    ${stats.min.toFixed(2)}ms`);
      console.log(`  Max:    ${stats.max.toFixed(2)}ms`);
      console.log(`  Avg:    ${stats.avg.toFixed(2)}ms`);
      console.log(`  Median: ${stats.median.toFixed(2)}ms`);
      console.log(`  P95:    ${stats.p95.toFixed(2)}ms`);
      console.log(`  P99:    ${stats.p99.toFixed(2)}ms`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// API Benchmarks
async function runApiBenchmarks(baseUrl: string = 'http://localhost:8080') {
  const benchmark = new Benchmark();

  console.log('🚀 Running API Benchmarks...\n');
  console.log(`📍 Base URL: ${baseUrl}\n`);

  // Health check benchmark
  await benchmark.measure(
    'GET /api/health',
    async () => {
      await fetch(`${baseUrl}/api/health`);
    },
    50
  );

  // Get all users benchmark
  await benchmark.measure(
    'GET /api/users',
    async () => {
      await fetch(`${baseUrl}/api/users`);
    },
    50
  );

  // Create user benchmark
  let userCounter = 0;
  await benchmark.measure(
    'POST /api/users',
    async () => {
      userCounter++;
      await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `benchuser${userCounter}`,
          email: `bench${userCounter}@example.com`,
          password: 'password123',
        }),
      });
    },
    30
  );

  benchmark.printResults();
}

// Data structure benchmarks
function runDataStructureBenchmarks() {
  const benchmark = new Benchmark();

  console.log('🚀 Running Data Structure Benchmarks...\n');

  // Array operations
  benchmark.measure(
    'Array: Create and fill 10k items',
    async () => {
      const arr = new Array(10000).fill(0).map((_, i) => i);
      return Promise.resolve(arr);
    },
    10
  );

  benchmark.measure(
    'Array: Find in 10k items',
    async () => {
      const arr = new Array(10000).fill(0).map((_, i) => i);
      arr.find((x) => x === 9999);
      return Promise.resolve();
    },
    10
  );

  // Map operations
  benchmark.measure(
    'Map: Create and fill 10k items',
    async () => {
      const map = new Map();
      for (let i = 0; i < 10000; i++) {
        map.set(i, i);
      }
      return Promise.resolve(map);
    },
    10
  );

  benchmark.measure(
    'Map: Get from 10k items',
    async () => {
      const map = new Map();
      for (let i = 0; i < 10000; i++) {
        map.set(i, i);
      }
      map.get(9999);
      return Promise.resolve();
    },
    10
  );

  // JSON operations
  benchmark.measure(
    'JSON: Stringify large object',
    async () => {
      const obj = {
        users: new Array(1000).fill(0).map((_, i) => ({
          id: `user_${i}`,
          username: `user${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date().toISOString(),
        })),
      };
      JSON.stringify(obj);
      return Promise.resolve();
    },
    10
  );

  benchmark.measure(
    'JSON: Parse large object',
    async () => {
      const obj = {
        users: new Array(1000).fill(0).map((_, i) => ({
          id: `user_${i}`,
          username: `user${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date().toISOString(),
        })),
      };
      const json = JSON.stringify(obj);
      JSON.parse(json);
      return Promise.resolve();
    },
    10
  );

  benchmark.printResults();
}

// Run benchmarks
async function runAllBenchmarks(apiUrl?: string) {
  console.log('\n' + '='.repeat(80));
  console.log('🏁 Full-Stack Template Benchmarks');
  console.log('='.repeat(80) + '\n');

  // Run data structure benchmarks (always available)
  runDataStructureBenchmarks();

  // Run API benchmarks if URL provided
  if (apiUrl) {
    try {
      await runApiBenchmarks(apiUrl);
    } catch (error) {
      console.log('⚠️  API benchmarks skipped (server not available)');
    }
  }

  console.log('✅ Benchmark suite completed\n');
}

// Run if executed directly
if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  const apiUrl = process.argv[2] || 'http://localhost:8080';
  runAllBenchmarks(apiUrl).catch((error) => {
    console.error('Benchmark execution failed:', error);
    process.exit(1);
  });
}

export { Benchmark, runAllBenchmarks, runApiBenchmarks, runDataStructureBenchmarks };
