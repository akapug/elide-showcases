/**
 * Latency benchmark - verify <100ms detection requirement.
 */

import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { Event } from '../core/event-buffer.js';

interface LatencyStats {
  algorithm: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  successRate: number;
  meetsRequirement: boolean;
}

class LatencyBenchmark {
  private modelManager!: ModelManager;
  private scorer!: RealtimeScorer;

  async run(): Promise<void> {
    console.log('⚡ Latency Benchmark - <100ms Detection Requirement\n');
    console.log('='repeat(80));

    await this.initialize();
    await this.trainModels();

    const results: LatencyStats[] = [];

    results.push(await this.benchmarkAlgorithm('isolation_forest', 1000));
    results.push(await this.benchmarkAlgorithm('lof', 1000));
    results.push(await this.benchmarkAlgorithm('one_class_svm', 500)); // Slower
    results.push(await this.benchmarkAlgorithm('timeseries', 1000));

    this.printResults(results);
  }

  async initialize(): Promise<void> {
    this.modelManager = new ModelManager('./models');
    await this.modelManager.initialize();
    this.scorer = new RealtimeScorer(this.modelManager, 100);
  }

  async trainModels(): Promise<void> {
    console.log('Training models...\n');

    const trainingData = this.generateData(1000, 10, 0.1);

    // Train each algorithm
    for (const algorithm of ['isolation_forest', 'lof', 'one_class_svm'] as const) {
      console.log(`  Training ${algorithm}...`);
      await this.modelManager.trainModel(algorithm, trainingData, {
        contamination: 0.1,
        novelty: algorithm === 'lof' ? true : undefined
      });
    }

    // Train time-series on 1D data
    const tsData = Array.from({ length: 1000 }, () => [Math.random() * 2]);
    await this.modelManager.trainModel('timeseries', tsData, {
      contamination: 0.1
    });

    console.log('\n');
  }

  async benchmarkAlgorithm(algorithm: string, iterations: number): Promise<LatencyStats> {
    console.log(`Benchmarking ${algorithm}...`);

    await this.modelManager.loadModel(algorithm);

    const latencies: number[] = [];
    let successes = 0;

    for (let i = 0; i < iterations; i++) {
      const event: Event = {
        id: `test_${i}`,
        timestamp: Date.now(),
        features: algorithm === 'timeseries'
          ? [Math.random() * 2]
          : Array.from({ length: 10 }, () => Math.random() * 2)
      };

      const start = performance.now();

      try {
        await this.scorer.scoreEvent(event, { algorithm: algorithm as any });
        const latency = performance.now() - start;
        latencies.push(latency);
        successes++;
      } catch (error) {
        // Timeout or error
        latencies.push(100);
      }

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
      }
    }

    console.log(); // New line after progress

    const sorted = latencies.sort((a, b) => a - b);
    const totalTime = latencies.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / iterations;

    return {
      algorithm,
      iterations,
      totalTimeMs: totalTime,
      avgTimeMs: avgTime,
      minTimeMs: sorted[0],
      maxTimeMs: sorted[sorted.length - 1],
      p50Ms: sorted[Math.floor(iterations * 0.5)],
      p95Ms: sorted[Math.floor(iterations * 0.95)],
      p99Ms: sorted[Math.floor(iterations * 0.99)],
      successRate: (successes / iterations) * 100,
      meetsRequirement: avgTime < 100 && sorted[Math.floor(iterations * 0.95)] < 100
    };
  }

  printResults(results: LatencyStats[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('LATENCY BENCHMARK RESULTS');
    console.log('='.repeat(80));
    console.log('Requirement: <100ms average latency, <100ms p95\n');

    for (const result of results) {
      const status = result.meetsRequirement ? '✅ PASS' : '❌ FAIL';

      console.log(`Algorithm: ${result.algorithm}`);
      console.log(`${status} ${result.meetsRequirement ? 'Meets' : 'Does not meet'} <100ms requirement`);
      console.log(`  Iterations:    ${result.iterations.toLocaleString()}`);
      console.log(`  Total Time:    ${result.totalTimeMs.toFixed(2)}ms`);
      console.log(`  Average:       ${result.avgTimeMs.toFixed(2)}ms`);
      console.log(`  Min:           ${result.minTimeMs.toFixed(2)}ms`);
      console.log(`  Max:           ${result.maxTimeMs.toFixed(2)}ms`);
      console.log(`  P50 (median):  ${result.p50Ms.toFixed(2)}ms`);
      console.log(`  P95:           ${result.p95Ms.toFixed(2)}ms`);
      console.log(`  P99:           ${result.p99Ms.toFixed(2)}ms`);
      console.log(`  Success Rate:  ${result.successRate.toFixed(1)}%`);
      console.log();
    }

    console.log('='.repeat(80));

    // Summary
    const allPass = results.every(r => r.meetsRequirement);
    const avgLatency = results.reduce((sum, r) => sum + r.avgTimeMs, 0) / results.length;

    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Status: ${allPass ? '✅ ALL PASS' : '⚠️  SOME FAILED'}`);
    console.log(`Average Latency Across All Algorithms: ${avgLatency.toFixed(2)}ms`);
    console.log(`Fastest Algorithm: ${results.reduce((min, r) => r.avgTimeMs < min.avgTimeMs ? r : min).algorithm}`);
    console.log('='.repeat(80));
  }

  generateData(nSamples: number, nFeatures: number, contamination: number): number[][] {
    const nNormal = Math.floor(nSamples * (1 - contamination));
    const nAnomalies = nSamples - nNormal;

    const normal = Array.from({ length: nNormal }, () =>
      Array.from({ length: nFeatures }, () => Math.random() * 2)
    );

    const anomalies = Array.from({ length: nAnomalies }, () =>
      Array.from({ length: nFeatures }, () => Math.random() * 20 + 10)
    );

    return [...normal, ...anomalies].sort(() => Math.random() - 0.5);
  }
}

// Run benchmark
const benchmark = new LatencyBenchmark();
benchmark.run().catch(console.error);
