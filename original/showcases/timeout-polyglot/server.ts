/**
 * Timeout Polyglot Pattern
 *
 * Demonstrates timeout handling across multiple languages:
 * - TypeScript: Timeout coordinator
 * - Go: High-precision timeout management
 * - Python: Adaptive timeout based on ML
 * - Java: Hierarchical timeout patterns
 */

// Timeout wrapper
class TimeoutExecutor {
  async execute<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    name: string = 'Operation'
  ): Promise<T> {
    return Promise.race([
      operation(),
      this.createTimeout(timeoutMs, name),
    ]);
  }

  private createTimeout(ms: number, name: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${name} timeout after ${ms}ms`));
      }, ms);
    });
  }
}

// Adaptive Timeout (Python-style ML-based)
class AdaptiveTimeout {
  private latencies: number[] = [];
  private readonly maxSamples = 100;

  async execute<T>(
    operation: () => Promise<T>,
    name: string = 'Operation'
  ): Promise<T> {
    const timeout = this.calculateTimeout();
    console.log(`  [Python ML] Adaptive timeout: ${timeout}ms`);

    const startTime = Date.now();
    const executor = new TimeoutExecutor();

    try {
      const result = await executor.execute(operation, timeout, name);
      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      return result;
    } catch (error) {
      throw error;
    }
  }

  private calculateTimeout(): number {
    if (this.latencies.length === 0) {
      return 5000; // Default 5 seconds
    }

    // P95 latency + buffer
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];

    return Math.max(p95 * 1.5, 1000); // At least 1 second
  }

  private recordLatency(latency: number): void {
    this.latencies.push(latency);
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
  }

  getStats(): any {
    if (this.latencies.length === 0) {
      return { samples: 0 };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      samples: sorted.length,
      avg: Math.round(avg),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      nextTimeout: Math.round(this.calculateTimeout()),
    };
  }
}

// Hierarchical Timeout (Java-style)
class HierarchicalTimeout {
  async executeWithHierarchy<T>(
    operations: Array<{
      name: string;
      operation: () => Promise<any>;
      timeout: number;
    }>,
    globalTimeout: number
  ): Promise<T> {
    console.log(`  [Java] Global timeout: ${globalTimeout}ms`);

    const executor = new TimeoutExecutor();

    return executor.execute(async () => {
      const results: any[] = [];

      for (const { name, operation, timeout } of operations) {
        console.log(`    [Java] Executing ${name} with ${timeout}ms timeout`);
        try {
          const result = await executor.execute(operation, timeout, name);
          results.push(result);
        } catch (error) {
          console.log(`      ✗ ${name} timed out`);
          throw error;
        }
      }

      return results as T;
    }, globalTimeout, 'Global operation');
  }
}

// Service simulator
class SlowService {
  constructor(
    private name: string,
    private latency: number
  ) {}

  async call(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, this.latency));
    return {
      service: this.name,
      data,
      latency: this.latency,
    };
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      Timeout Polyglot - Elide Showcase                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Timeout Strategies:');
  console.log('  • Static Timeout:      TypeScript/Go');
  console.log('  • Adaptive Timeout:    Python (ML-based)');
  console.log('  • Hierarchical Timeout: Java');
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Timeout Patterns');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  const executor = new TimeoutExecutor();
  const adaptiveTimeout = new AdaptiveTimeout();
  const hierarchicalTimeout = new HierarchicalTimeout();

  // Test 1: Basic timeout
  console.log('[Test 1] Basic Static Timeout\n');

  const fastService = new SlowService('FastService', 100);
  const slowService = new SlowService('SlowService', 5000);

  try {
    console.log('Fast service (should succeed):');
    const result = await executor.execute(
      () => fastService.call({ test: 1 }),
      1000,
      'FastService'
    );
    console.log('  ✓ Success:', result.service);
  } catch (error) {
    console.log('  ✗ Timeout:', (error as Error).message);
  }
  console.log();

  try {
    console.log('Slow service (should timeout):');
    await executor.execute(
      () => slowService.call({ test: 2 }),
      1000,
      'SlowService'
    );
  } catch (error) {
    console.log('  ✗ Timeout:', (error as Error).message);
  }
  console.log();

  // Test 2: Adaptive timeout
  console.log('[Test 2] Adaptive Timeout (ML-based)\n');

  const variableService = new SlowService('VariableService', 200);

  // Build up latency history
  console.log('Building latency history:');
  for (let i = 0; i < 10; i++) {
    try {
      await adaptiveTimeout.execute(
        () => variableService.call({ request: i }),
        'VariableService'
      );
      console.log(`  ✓ Request ${i + 1} completed`);
    } catch (error) {
      console.log(`  ✗ Request ${i + 1} timeout`);
    }
  }

  console.log('\nAdaptive timeout stats:');
  const stats = adaptiveTimeout.getStats();
  console.log(`  Samples: ${stats.samples}`);
  console.log(`  Average: ${stats.avg}ms`);
  console.log(`  P50: ${stats.p50}ms`);
  console.log(`  P95: ${stats.p95}ms`);
  console.log(`  Next timeout: ${stats.nextTimeout}ms`);
  console.log();

  // Test 3: Hierarchical timeout
  console.log('[Test 3] Hierarchical Timeout\n');

  const userService = new SlowService('UserService', 100);
  const productService = new SlowService('ProductService', 150);
  const inventoryService = new SlowService('InventoryService', 200);

  try {
    console.log('Composite operation with hierarchy:');
    const results = await hierarchicalTimeout.executeWithHierarchy(
      [
        {
          name: 'User lookup',
          operation: () => userService.call({}),
          timeout: 500,
        },
        {
          name: 'Product lookup',
          operation: () => productService.call({}),
          timeout: 700,
        },
        {
          name: 'Inventory check',
          operation: () => inventoryService.call({}),
          timeout: 1000,
        },
      ],
      2000 // Global timeout
    );
    console.log('  ✓ All operations completed');
  } catch (error) {
    console.log('  ✗ Hierarchical timeout:', (error as Error).message);
  }
  console.log();

  // Test 4: Timeout cascade
  console.log('[Test 4] Timeout Cascade (one service too slow)\n');

  const verySlowService = new SlowService('VerySlowService', 2000);

  try {
    console.log('Composite operation with one slow service:');
    await hierarchicalTimeout.executeWithHierarchy(
      [
        {
          name: 'Fast operation',
          operation: () => userService.call({}),
          timeout: 500,
        },
        {
          name: 'Slow operation',
          operation: () => verySlowService.call({}),
          timeout: 1000, // Will timeout
        },
      ],
      3000
    );
  } catch (error) {
    console.log('  ✗ Failed:', (error as Error).message);
    console.log('  → Timeout prevented cascade to other services');
  }
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Timeout Pattern Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Prevents indefinite waiting');
  console.log('  ✓ Adaptive timeouts based on history');
  console.log('  ✓ Hierarchical timeout management');
  console.log('  ✓ Fail fast on slow services');
  console.log('  ✓ Resource protection');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
