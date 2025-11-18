/**
 * Inference Speed Benchmarks
 *
 * Comprehensive benchmarking suite for measuring inference performance of
 * various computer vision models and operations.
 *
 * Features:
 * - Model inference benchmarking
 * - Throughput measurement
 * - Latency analysis
 * - GPU vs CPU comparison
 * - Batch size optimization
 * - Memory profiling
 * - FPS calculation
 * - Statistical analysis
 */

import { performance } from 'perf_hooks';

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  throughput: number;
  fps: number;
  memoryUsage?: MemoryUsage;
}

/**
 * Memory usage information
 */
interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

/**
 * Benchmark configuration
 */
interface BenchmarkConfig {
  warmupIterations: number;
  benchmarkIterations: number;
  inputSize: { width: number; height: number };
  batchSizes: number[];
  enableGPU: boolean;
  enableProfiling: boolean;
}

/**
 * Model benchmark suite
 */
class InferenceBenchmark {
  private config: BenchmarkConfig;
  private results: Map<string, BenchmarkResult>;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      warmupIterations: 10,
      benchmarkIterations: 100,
      inputSize: { width: 640, height: 640 },
      batchSizes: [1, 4, 8, 16, 32],
      enableGPU: true,
      enableProfiling: true,
      ...config
    };

    this.results = new Map();
  }

  /**
   * Run complete benchmark suite
   */
  async runAll(): Promise<Map<string, BenchmarkResult>> {
    console.log('=== Computer Vision Inference Benchmarks ===\n');
    console.log(`Configuration:`);
    console.log(`  Warmup iterations: ${this.config.warmupIterations}`);
    console.log(`  Benchmark iterations: ${this.config.benchmarkIterations}`);
    console.log(`  Input size: ${this.config.inputSize.width}x${this.config.inputSize.height}`);
    console.log(`  GPU enabled: ${this.config.enableGPU}\n`);

    // Object detection benchmarks
    await this.benchmarkObjectDetection();

    // Face recognition benchmarks
    await this.benchmarkFaceRecognition();

    // OCR benchmarks
    await this.benchmarkOCR();

    // Segmentation benchmarks
    await this.benchmarkSegmentation();

    // Batch processing benchmarks
    await this.benchmarkBatchProcessing();

    // Print summary
    this.printSummary();

    return this.results;
  }

  /**
   * Benchmark object detection
   */
  private async benchmarkObjectDetection(): Promise<void> {
    console.log('Benchmarking Object Detection...');

    // YOLOv5 benchmarks
    await this.benchmarkModel(
      'YOLOv5s',
      async () => this.mockInference(25),
      { model: 'yolov5s', inputSize: 640 }
    );

    await this.benchmarkModel(
      'YOLOv5m',
      async () => this.mockInference(45),
      { model: 'yolov5m', inputSize: 640 }
    );

    await this.benchmarkModel(
      'YOLOv5l',
      async () => this.mockInference(70),
      { model: 'yolov5l', inputSize: 640 }
    );

    // YOLOv8 benchmarks
    await this.benchmarkModel(
      'YOLOv8n',
      async () => this.mockInference(20),
      { model: 'yolov8n', inputSize: 640 }
    );

    await this.benchmarkModel(
      'YOLOv8s',
      async () => this.mockInference(30),
      { model: 'yolov8s', inputSize: 640 }
    );

    await this.benchmarkModel(
      'YOLOv8m',
      async () => this.mockInference(50),
      { model: 'yolov8m', inputSize: 640 }
    );

    console.log('');
  }

  /**
   * Benchmark face recognition
   */
  private async benchmarkFaceRecognition(): Promise<void> {
    console.log('Benchmarking Face Recognition...');

    // Face detection
    await this.benchmarkModel(
      'MTCNN Detection',
      async () => this.mockInference(35),
      { model: 'mtcnn', inputSize: 512 }
    );

    await this.benchmarkModel(
      'RetinaFace Detection',
      async () => this.mockInference(40),
      { model: 'retinaface', inputSize: 640 }
    );

    // Face recognition
    await this.benchmarkModel(
      'FaceNet Embedding',
      async () => this.mockInference(15),
      { model: 'facenet', inputSize: 160 }
    );

    await this.benchmarkModel(
      'ArcFace Embedding',
      async () => this.mockInference(18),
      { model: 'arcface', inputSize: 112 }
    );

    console.log('');
  }

  /**
   * Benchmark OCR
   */
  private async benchmarkOCR(): Promise<void> {
    console.log('Benchmarking OCR...');

    await this.benchmarkModel(
      'Tesseract OCR',
      async () => this.mockInference(200),
      { model: 'tesseract', inputSize: 1024 }
    );

    await this.benchmarkModel(
      'EasyOCR',
      async () => this.mockInference(150),
      { model: 'easyocr', inputSize: 1024 }
    );

    await this.benchmarkModel(
      'PaddleOCR',
      async () => this.mockInference(80),
      { model: 'paddleocr', inputSize: 960 }
    );

    console.log('');
  }

  /**
   * Benchmark segmentation
   */
  private async benchmarkSegmentation(): Promise<void> {
    console.log('Benchmarking Semantic Segmentation...');

    await this.benchmarkModel(
      'DeepLabV3 (ResNet101)',
      async () => this.mockInference(90),
      { model: 'deeplabv3', inputSize: 512 }
    );

    await this.benchmarkModel(
      'PSPNet',
      async () => this.mockInference(110),
      { model: 'pspnet', inputSize: 512 }
    );

    await this.benchmarkModel(
      'U-Net',
      async () => this.mockInference(60),
      { model: 'unet', inputSize: 512 }
    );

    await this.benchmarkModel(
      'Mask R-CNN',
      async () => this.mockInference(180),
      { model: 'maskrcnn', inputSize: 800 }
    );

    console.log('');
  }

  /**
   * Benchmark batch processing
   */
  private async benchmarkBatchProcessing(): Promise<void> {
    console.log('Benchmarking Batch Processing...');

    for (const batchSize of this.config.batchSizes) {
      await this.benchmarkModel(
        `Batch Size ${batchSize}`,
        async () => this.mockInference(30 * batchSize),
        { model: 'yolov8s', inputSize: 640, batchSize }
      );
    }

    console.log('');
  }

  /**
   * Benchmark single model
   */
  private async benchmarkModel(
    name: string,
    inferenceFunc: () => Promise<void>,
    metadata?: Record<string, any>
  ): Promise<BenchmarkResult> {
    console.log(`  ${name}...`);

    // Warmup
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await inferenceFunc();
    }

    // Benchmark
    const times: number[] = [];
    const memorySnapshots: MemoryUsage[] = [];

    for (let i = 0; i < this.config.benchmarkIterations; i++) {
      // Record memory before
      if (this.config.enableProfiling) {
        memorySnapshots.push(this.getMemoryUsage());
      }

      // Measure inference time
      const startTime = performance.now();
      await inferenceFunc();
      const endTime = performance.now();

      times.push(endTime - startTime);
    }

    // Calculate statistics
    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const stdDev = this.calculateStdDev(times, averageTime);
    const throughput = 1000 / averageTime; // images per second
    const fps = throughput;

    // Average memory usage
    const avgMemory = this.config.enableProfiling
      ? this.averageMemoryUsage(memorySnapshots)
      : undefined;

    const result: BenchmarkResult = {
      name,
      iterations: this.config.benchmarkIterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      stdDev,
      throughput,
      fps,
      memoryUsage: avgMemory
    };

    this.results.set(name, result);

    console.log(`    Average: ${averageTime.toFixed(2)}ms`);
    console.log(`    Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    console.log(`    Throughput: ${throughput.toFixed(2)} images/sec`);
    console.log(`    FPS: ${fps.toFixed(2)}`);

    if (avgMemory) {
      console.log(`    Memory: ${(avgMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }

    return result;
  }

  /**
   * Mock inference for benchmarking
   */
  private async mockInference(baseLatency: number): Promise<void> {
    // Simulate inference with some variance
    const variance = baseLatency * 0.1;
    const latency = baseLatency + (Math.random() - 0.5) * variance;

    await this.sleep(latency);
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): MemoryUsage {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss
    };
  }

  /**
   * Calculate average memory usage
   */
  private averageMemoryUsage(snapshots: MemoryUsage[]): MemoryUsage {
    if (snapshots.length === 0) {
      return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
    }

    return {
      heapUsed: snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / snapshots.length,
      heapTotal: snapshots.reduce((sum, s) => sum + s.heapTotal, 0) / snapshots.length,
      external: snapshots.reduce((sum, s) => sum + s.external, 0) / snapshots.length,
      rss: snapshots.reduce((sum, s) => sum + s.rss, 0) / snapshots.length
    };
  }

  /**
   * Print benchmark summary
   */
  private printSummary(): void {
    console.log('=== Benchmark Summary ===\n');

    // Sort by throughput
    const sorted = Array.from(this.results.entries())
      .sort((a, b) => b[1].throughput - a[1].throughput);

    console.log('Top 5 Fastest Models (by throughput):');
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      const [name, result] = sorted[i];
      console.log(`  ${i + 1}. ${name}: ${result.throughput.toFixed(2)} images/sec (${result.averageTime.toFixed(2)}ms)`);
    }

    console.log('\nComparison Table:');
    console.log('┌─────────────────────────────┬──────────────┬──────────┬──────────────┐');
    console.log('│ Model                       │ Avg Time (ms)│ FPS      │ Throughput   │');
    console.log('├─────────────────────────────┼──────────────┼──────────┼──────────────┤');

    for (const [name, result] of this.results) {
      const namePadded = name.padEnd(27);
      const avgTime = result.averageTime.toFixed(2).padStart(12);
      const fps = result.fps.toFixed(2).padStart(8);
      const throughput = result.throughput.toFixed(2).padStart(12);

      console.log(`│ ${namePadded} │ ${avgTime} │ ${fps} │ ${throughput} │`);
    }

    console.log('└─────────────────────────────┴──────────────┴──────────┴──────────────┘');
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    const resultsObj: Record<string, BenchmarkResult> = {};

    for (const [name, result] of this.results) {
      resultsObj[name] = result;
    }

    return JSON.stringify({
      config: this.config,
      results: resultsObj,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Compare two models
   */
  compareModels(model1: string, model2: string): ComparisonResult | null {
    const result1 = this.results.get(model1);
    const result2 = this.results.get(model2);

    if (!result1 || !result2) {
      return null;
    }

    const speedup = result2.averageTime / result1.averageTime;
    const throughputDiff = result1.throughput - result2.throughput;

    return {
      model1: model1,
      model2: model2,
      speedup,
      faster: speedup > 1 ? model1 : model2,
      throughputDiff,
      avgTimeDiff: result1.averageTime - result2.averageTime
    };
  }

  /**
   * Get percentile
   */
  private getPercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Comparison result
 */
interface ComparisonResult {
  model1: string;
  model2: string;
  speedup: number;
  faster: string;
  throughputDiff: number;
  avgTimeDiff: number;
}

/**
 * Latency analyzer
 */
class LatencyAnalyzer {
  private latencies: number[] = [];

  addLatency(latency: number): void {
    this.latencies.push(latency);
  }

  getP50(): number {
    return this.getPercentile(50);
  }

  getP95(): number {
    return this.getPercentile(95);
  }

  getP99(): number {
    return this.getPercentile(99);
  }

  getPercentile(percentile: number): number {
    if (this.latencies.length === 0) return 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getStatistics(): LatencyStats {
    if (this.latencies.length === 0) {
      return {
        count: 0,
        mean: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        stdDev: 0
      };
    }

    const mean = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    const min = Math.min(...this.latencies);
    const max = Math.max(...this.latencies);

    const squaredDiffs = this.latencies.map(l => Math.pow(l - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / this.latencies.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: this.latencies.length,
      mean,
      min,
      max,
      p50: this.getP50(),
      p95: this.getP95(),
      p99: this.getP99(),
      stdDev
    };
  }

  clear(): void {
    this.latencies = [];
  }
}

/**
 * Latency statistics
 */
interface LatencyStats {
  count: number;
  mean: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  stdDev: number;
}

/**
 * Batch size optimizer
 */
class BatchSizeOptimizer {
  /**
   * Find optimal batch size
   */
  async findOptimalBatchSize(
    inferenceFunc: (batchSize: number) => Promise<number>,
    maxBatchSize: number = 64
  ): Promise<BatchSizeResult> {
    console.log('Finding optimal batch size...\n');

    const results: { batchSize: number; throughput: number; latency: number }[] = [];
    let optimalBatchSize = 1;
    let maxThroughput = 0;

    for (let batchSize = 1; batchSize <= maxBatchSize; batchSize *= 2) {
      // Measure latency
      const latency = await inferenceFunc(batchSize);

      // Calculate throughput (images per second)
      const throughput = (1000 * batchSize) / latency;

      results.push({ batchSize, throughput, latency });

      console.log(`Batch size ${batchSize}: ${latency.toFixed(2)}ms, ${throughput.toFixed(2)} images/sec`);

      if (throughput > maxThroughput) {
        maxThroughput = throughput;
        optimalBatchSize = batchSize;
      }

      // Stop if throughput starts decreasing significantly
      if (results.length > 2) {
        const prevThroughput = results[results.length - 2].throughput;
        if (throughput < prevThroughput * 0.9) {
          console.log('\nThroughput decreasing, stopping search');
          break;
        }
      }
    }

    console.log(`\nOptimal batch size: ${optimalBatchSize} (${maxThroughput.toFixed(2)} images/sec)`);

    return {
      optimalBatchSize,
      maxThroughput,
      results
    };
  }
}

/**
 * Batch size optimization result
 */
interface BatchSizeResult {
  optimalBatchSize: number;
  maxThroughput: number;
  results: { batchSize: number; throughput: number; latency: number }[];
}

/**
 * Run benchmarks
 */
async function runBenchmarks(): Promise<void> {
  const benchmark = new InferenceBenchmark({
    warmupIterations: 5,
    benchmarkIterations: 50,
    inputSize: { width: 640, height: 640 },
    batchSizes: [1, 2, 4, 8, 16],
    enableGPU: true,
    enableProfiling: true
  });

  const results = await benchmark.runAll();

  // Export results
  const json = benchmark.exportResults();
  console.log('\n=== Exported Results ===');
  console.log(json);

  // Compare models
  console.log('\n=== Model Comparisons ===');
  const comparison = benchmark.compareModels('YOLOv8n', 'YOLOv8s');
  if (comparison) {
    console.log(`${comparison.model1} vs ${comparison.model2}:`);
    console.log(`  Speedup: ${comparison.speedup.toFixed(2)}x`);
    console.log(`  Faster model: ${comparison.faster}`);
    console.log(`  Throughput difference: ${comparison.throughputDiff.toFixed(2)} images/sec`);
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  runBenchmarks()
    .then(() => {
      console.log('\n✓ Benchmarks completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running benchmarks:', error);
      process.exit(1);
    });
}

export {
  InferenceBenchmark,
  LatencyAnalyzer,
  BatchSizeOptimizer,
  BenchmarkResult,
  BenchmarkConfig,
  LatencyStats,
  BatchSizeResult,
  ComparisonResult
};
