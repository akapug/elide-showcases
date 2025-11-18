/**
 * Test Performance Benchmarking
 *
 * Measures and analyzes test execution performance across different languages,
 * identifies bottlenecks, and provides optimization recommendations.
 */

import { TestRunner, Language, TestRunnerConfig } from '../src/test-runner';
import { performance } from 'perf_hooks';

export interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  languages: Language[];
  parallel: boolean;
  maxWorkers: number;
}

export interface BenchmarkResult {
  language: Language;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  throughput: number;
  samples: number[];
}

export interface ComparisonResult {
  fastest: Language;
  slowest: Language;
  results: Map<Language, BenchmarkResult>;
  speedup: Map<string, number>;
  recommendations: string[];
}

/**
 * Performance benchmarking suite
 */
export class PerformanceBenchmark {
  private config: BenchmarkConfig;

  constructor(config: Partial<BenchmarkConfig>) {
    this.config = {
      iterations: config.iterations || 100,
      warmupRuns: config.warmupRuns || 5,
      languages: config.languages || ['typescript', 'python', 'ruby', 'java'],
      parallel: config.parallel ?? true,
      maxWorkers: config.maxWorkers || 4
    };
  }

  /**
   * Run full benchmark suite
   */
  async run(): Promise<ComparisonResult> {
    console.log('Starting performance benchmarks...\n');

    // Warmup
    console.log('Warming up...');
    await this.warmup();

    // Run benchmarks for each language
    const results = new Map<Language, BenchmarkResult>();

    for (const language of this.config.languages) {
      console.log(`\nBenchmarking ${language}...`);
      const result = await this.benchmarkLanguage(language);
      results.set(language, result);
      this.printResult(result);
    }

    // Compare results
    const comparison = this.compareResults(results);
    this.printComparison(comparison);

    return comparison;
  }

  /**
   * Warmup runs to stabilize performance
   */
  private async warmup(): Promise<void> {
    for (let i = 0; i < this.config.warmupRuns; i++) {
      const runner = new TestRunner({
        languages: this.config.languages,
        parallel: false,
        maxWorkers: 1
      });

      await runner.discover();
      await runner.run();
    }
  }

  /**
   * Benchmark a specific language
   */
  private async benchmarkLanguage(language: Language): Promise<BenchmarkResult> {
    const samples: number[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const startTime = performance.now();

      const runner = new TestRunner({
        languages: [language],
        parallel: this.config.parallel,
        maxWorkers: this.config.maxWorkers
      });

      await runner.discover();
      await runner.run();

      const endTime = performance.now();
      const duration = endTime - startTime;
      samples.push(duration);

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${this.config.iterations}`);
      }
    }

    process.stdout.write('\n');

    return this.calculateStatistics(language, samples);
  }

  /**
   * Calculate statistical metrics
   */
  private calculateStatistics(language: Language, samples: number[]): BenchmarkResult {
    const totalTime = samples.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / samples.length;
    const minTime = Math.min(...samples);
    const maxTime = Math.max(...samples);

    // Calculate standard deviation
    const variance = samples.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    // Calculate throughput (tests per second)
    const throughput = 1000 / averageTime;

    return {
      language,
      iterations: samples.length,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      stdDev,
      throughput,
      samples
    };
  }

  /**
   * Compare results across languages
   */
  private compareResults(results: Map<Language, BenchmarkResult>): ComparisonResult {
    const sortedResults = Array.from(results.entries()).sort((a, b) => a[1].averageTime - b[1].averageTime);

    const fastest = sortedResults[0][0];
    const slowest = sortedResults[sortedResults.length - 1][0];

    // Calculate speedup factors
    const fastestTime = results.get(fastest)!.averageTime;
    const speedup = new Map<string, number>();

    for (const [language, result] of results) {
      speedup.set(language, result.averageTime / fastestTime);
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      fastest,
      slowest,
      results,
      speedup,
      recommendations
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(results: Map<Language, BenchmarkResult>): string[] {
    const recommendations: string[] = [];

    for (const [language, result] of results) {
      // High standard deviation
      if (result.stdDev > result.averageTime * 0.2) {
        recommendations.push(
          `${language}: High variance detected (σ=${result.stdDev.toFixed(2)}ms). Consider investigating inconsistent test execution.`
        );
      }

      // Slow average time
      if (result.averageTime > 1000) {
        recommendations.push(
          `${language}: Average execution time is high (${result.averageTime.toFixed(2)}ms). Consider optimizing test setup/teardown.`
        );
      }

      // Low throughput
      if (result.throughput < 10) {
        recommendations.push(
          `${language}: Low throughput (${result.throughput.toFixed(2)} tests/s). Consider enabling parallel execution.`
        );
      }
    }

    // Parallelization recommendation
    if (!this.config.parallel) {
      recommendations.push('Enable parallel execution to improve overall test suite performance.');
    }

    return recommendations;
  }

  /**
   * Print individual result
   */
  private printResult(result: BenchmarkResult): void {
    console.log(`  Average: ${result.averageTime.toFixed(2)}ms`);
    console.log(`  Min: ${result.minTime.toFixed(2)}ms`);
    console.log(`  Max: ${result.maxTime.toFixed(2)}ms`);
    console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} tests/s`);
  }

  /**
   * Print comparison results
   */
  private printComparison(comparison: ComparisonResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('PERFORMANCE COMPARISON');
    console.log('='.repeat(60));

    console.log(`\nFastest: ${comparison.fastest}`);
    console.log(`Slowest: ${comparison.slowest}`);

    console.log('\nSpeedup Factors (relative to fastest):');
    for (const [language, factor] of comparison.speedup) {
      console.log(`  ${language}: ${factor.toFixed(2)}x`);
    }

    if (comparison.recommendations.length > 0) {
      console.log('\nRecommendations:');
      for (const recommendation of comparison.recommendations) {
        console.log(`  - ${recommendation}`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Memory usage benchmarking
 */
export class MemoryBenchmark {
  async run(language: Language): Promise<MemoryResult> {
    const before = process.memoryUsage();

    const runner = new TestRunner({
      languages: [language],
      parallel: false
    });

    await runner.discover();
    await runner.run();

    const after = process.memoryUsage();

    return {
      language,
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external,
      rss: after.rss - before.rss
    };
  }
}

export interface MemoryResult {
  language: Language;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Parallel execution benchmark
 */
export class ParallelBenchmark {
  async run(): Promise<ParallelResult[]> {
    const workerCounts = [1, 2, 4, 8, 16];
    const results: ParallelResult[] = [];

    for (const workers of workerCounts) {
      console.log(`\nBenchmarking with ${workers} workers...`);

      const startTime = performance.now();

      const runner = new TestRunner({
        languages: ['typescript', 'python', 'ruby', 'java'],
        parallel: true,
        maxWorkers: workers
      });

      await runner.discover();
      await runner.run();

      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        workers,
        duration,
        speedup: results.length > 0 ? results[0].duration / duration : 1
      });

      console.log(`  Duration: ${duration.toFixed(2)}ms`);
      console.log(`  Speedup: ${results[results.length - 1].speedup.toFixed(2)}x`);
    }

    return results;
  }
}

export interface ParallelResult {
  workers: number;
  duration: number;
  speedup: number;
}

/**
 * Test discovery benchmark
 */
export class DiscoveryBenchmark {
  async run(): Promise<DiscoveryResult[]> {
    const results: DiscoveryResult[] = [];

    const languages: Language[] = ['typescript', 'python', 'ruby', 'java'];

    for (const language of languages) {
      const startTime = performance.now();

      const runner = new TestRunner({
        languages: [language]
      });

      const suites = await runner.discover();

      const endTime = performance.now();
      const duration = endTime - startTime;

      const testCount = suites.reduce((sum, suite) => sum + suite.tests.length, 0);

      results.push({
        language,
        duration,
        suiteCount: suites.length,
        testCount,
        throughput: testCount / (duration / 1000)
      });

      console.log(`${language}: ${duration.toFixed(2)}ms (${testCount} tests)`);
    }

    return results;
  }
}

export interface DiscoveryResult {
  language: Language;
  duration: number;
  suiteCount: number;
  testCount: number;
  throughput: number;
}

/**
 * Load testing
 */
export class LoadTest {
  async run(testCount: number): Promise<LoadTestResult> {
    console.log(`\nRunning load test with ${testCount} tests...`);

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();

    const runner = new TestRunner({
      languages: ['typescript'],
      parallel: true,
      maxWorkers: 8
    });

    // Generate dummy tests
    await runner.discover();

    const results = await runner.run();

    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();

    const duration = endTime - startTime;
    const memoryUsed = memoryAfter.heapUsed - memoryBefore.heapUsed;

    return {
      testCount,
      duration,
      throughput: testCount / (duration / 1000),
      memoryUsed,
      memoryPerTest: memoryUsed / testCount,
      passRate: (results.passed / results.total) * 100
    };
  }
}

export interface LoadTestResult {
  testCount: number;
  duration: number;
  throughput: number;
  memoryUsed: number;
  memoryPerTest: number;
  passRate: number;
}

/**
 * Main benchmark runner
 */
export async function runAllBenchmarks(): Promise<void> {
  console.log('=' .repeat(60));
  console.log('POLYGLOT TESTING FRAMEWORK - PERFORMANCE BENCHMARKS');
  console.log('='.repeat(60));

  // 1. Language performance comparison
  console.log('\n1. Language Performance Comparison\n');
  const perfBench = new PerformanceBenchmark({
    iterations: 50,
    warmupRuns: 3
  });
  await perfBench.run();

  // 2. Memory usage
  console.log('\n2. Memory Usage Analysis\n');
  const memBench = new MemoryBenchmark();
  for (const lang of ['typescript', 'python', 'ruby', 'java'] as Language[]) {
    const result = await memBench.run(lang);
    console.log(`${lang}:`);
    console.log(`  Heap Used: ${(result.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  RSS: ${(result.rss / 1024 / 1024).toFixed(2)}MB`);
  }

  // 3. Parallel execution scaling
  console.log('\n3. Parallel Execution Scaling\n');
  const parallelBench = new ParallelBenchmark();
  await parallelBench.run();

  // 4. Test discovery performance
  console.log('\n4. Test Discovery Performance\n');
  const discoveryBench = new DiscoveryBenchmark();
  await discoveryBench.run();

  // 5. Load testing
  console.log('\n5. Load Testing\n');
  const loadTest = new LoadTest();
  for (const count of [100, 500, 1000]) {
    const result = await loadTest.run(count);
    console.log(`${count} tests:`);
    console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} tests/s`);
    console.log(`  Memory/test: ${(result.memoryPerTest / 1024).toFixed(2)}KB`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('BENCHMARKS COMPLETE');
  console.log('='.repeat(60));
}

// Run benchmarks if executed directly
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}

export default {
  PerformanceBenchmark,
  MemoryBenchmark,
  ParallelBenchmark,
  DiscoveryBenchmark,
  LoadTest,
  runAllBenchmarks
};
