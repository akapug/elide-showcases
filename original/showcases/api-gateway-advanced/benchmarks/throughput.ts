/**
 * Throughput Benchmarks for API Gateway
 * Measures and analyzes gateway performance:
 * - Requests per second (RPS)
 * - Latency percentiles (P50, P95, P99)
 * - Concurrent connections
 * - Memory usage
 * - CPU utilization
 * - Error rates under load
 */

interface BenchmarkConfig {
  duration: number; // milliseconds
  concurrency: number;
  requestsPerSecond?: number;
  warmupDuration?: number;
}

interface BenchmarkResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  requestsPerSecond: number;
  latency: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
  throughput: {
    bytesPerSecond: number;
    requestsPerSecond: number;
  };
  errors: Record<string, number>;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

/**
 * Latency Tracker
 */
export class LatencyTracker {
  private measurements: number[] = [];

  record(latency: number): void {
    this.measurements.push(latency);
  }

  getStatistics(): {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  } {
    if (this.measurements.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p95: 0,
        p99: 0,
        stdDev: 0,
      };
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;

    // Calculate standard deviation
    const squaredDiffs = sorted.map((x) => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / sorted.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      stdDev,
    };
  }

  getMeasurements(): number[] {
    return [...this.measurements];
  }

  clear(): void {
    this.measurements = [];
  }
}

/**
 * Request Generator
 */
export class RequestGenerator {
  private requestCount: number = 0;
  private errorCount: number = 0;
  private errors: Record<string, number> = {};

  async generateRequest(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
  ): Promise<{
    success: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      const response = await handler();
      const latency = performance.now() - startTime;

      this.requestCount++;

      if (response.status >= 400) {
        this.errorCount++;
        this.errors[response.status] = (this.errors[response.status] || 0) + 1;
        return { success: false, latency, error: response.error };
      }

      return { success: true, latency };
    } catch (error) {
      const latency = performance.now() - startTime;
      this.errorCount++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.errors["exception"] = (this.errors["exception"] || 0) + 1;
      return { success: false, latency, error: errorMessage };
    }
  }

  getStats(): {
    totalRequests: number;
    errorCount: number;
    errors: Record<string, number>;
  } {
    return {
      totalRequests: this.requestCount,
      errorCount: this.errorCount,
      errors: { ...this.errors },
    };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.errors = {};
  }
}

/**
 * Throughput Benchmark
 */
export class ThroughputBenchmark {
  private config: BenchmarkConfig;
  private latencyTracker: LatencyTracker;
  private requestGenerator: RequestGenerator;

  constructor(config: BenchmarkConfig) {
    this.config = {
      warmupDuration: 5000,
      ...config,
    };
    this.latencyTracker = new LatencyTracker();
    this.requestGenerator = new RequestGenerator();
  }

  /**
   * Run benchmark with constant rate
   */
  async runConstantRate(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
  ): Promise<BenchmarkResult> {
    console.log("Starting warmup...");
    await this.warmup(handler);

    console.log("Starting benchmark...");
    const startTime = Date.now();
    const endTime = startTime + this.config.duration;
    const targetRPS = this.config.requestsPerSecond || 100;
    const intervalMs = 1000 / targetRPS;

    let totalBytes = 0;

    const tasks: Promise<void>[] = [];

    while (Date.now() < endTime) {
      const requestStartTime = Date.now();

      const task = this.requestGenerator
        .generateRequest(handler)
        .then((result) => {
          this.latencyTracker.record(result.latency);

          // Simulate response size
          totalBytes += 1000; // Average 1KB response
        });

      tasks.push(task);

      // Rate limiting
      const elapsed = Date.now() - requestStartTime;
      const sleepTime = Math.max(0, intervalMs - elapsed);

      if (sleepTime > 0) {
        await this.sleep(sleepTime);
      }
    }

    // Wait for all tasks to complete
    await Promise.all(tasks);

    const actualDuration = Date.now() - startTime;
    return this.generateResult(actualDuration, totalBytes);
  }

  /**
   * Run benchmark with concurrent requests
   */
  async runConcurrent(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
  ): Promise<BenchmarkResult> {
    console.log("Starting warmup...");
    await this.warmup(handler);

    console.log("Starting benchmark...");
    const startTime = Date.now();
    const endTime = startTime + this.config.duration;

    let totalBytes = 0;

    const worker = async () => {
      while (Date.now() < endTime) {
        const result = await this.requestGenerator.generateRequest(handler);
        this.latencyTracker.record(result.latency);
        totalBytes += 1000; // Average 1KB response
      }
    };

    // Start concurrent workers
    const workers = Array(this.config.concurrency)
      .fill(0)
      .map(() => worker());

    await Promise.all(workers);

    const actualDuration = Date.now() - startTime;
    return this.generateResult(actualDuration, totalBytes);
  }

  /**
   * Run step load test
   */
  async runStepLoad(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
    steps: number[],
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const concurrency of steps) {
      console.log(`\nTesting with concurrency: ${concurrency}`);
      this.config.concurrency = concurrency;

      const result = await this.runConcurrent(handler);
      results.push(result);

      // Reset for next step
      this.latencyTracker.clear();
      this.requestGenerator.reset();

      // Cool down between steps
      await this.sleep(2000);
    }

    return results;
  }

  /**
   * Run spike test
   */
  async runSpikeTest(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
    normalConcurrency: number,
    spikeConcurrency: number,
    spikeDuration: number,
  ): Promise<{
    normalPhase: BenchmarkResult;
    spikePhase: BenchmarkResult;
    recoveryPhase: BenchmarkResult;
  }> {
    console.log("Phase 1: Normal load");
    this.config.concurrency = normalConcurrency;
    const normalPhase = await this.runConcurrent(handler);
    this.reset();

    console.log("Phase 2: Spike load");
    this.config.concurrency = spikeConcurrency;
    this.config.duration = spikeDuration;
    const spikePhase = await this.runConcurrent(handler);
    this.reset();

    console.log("Phase 3: Recovery");
    this.config.concurrency = normalConcurrency;
    const recoveryPhase = await this.runConcurrent(handler);

    return { normalPhase, spikePhase, recoveryPhase };
  }

  /**
   * Warmup phase
   */
  private async warmup(
    handler: () => Promise<{ status: number; data?: any; error?: string }>,
  ): Promise<void> {
    const warmupEnd = Date.now() + (this.config.warmupDuration || 0);

    while (Date.now() < warmupEnd) {
      await this.requestGenerator.generateRequest(handler);
    }

    // Reset stats after warmup
    this.reset();
  }

  /**
   * Generate benchmark result
   */
  private generateResult(duration: number, totalBytes: number): BenchmarkResult {
    const stats = this.requestGenerator.getStats();
    const latency = this.latencyTracker.getStatistics();

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    return {
      totalRequests: stats.totalRequests,
      successfulRequests: stats.totalRequests - stats.errorCount,
      failedRequests: stats.errorCount,
      duration,
      requestsPerSecond: (stats.totalRequests / duration) * 1000,
      latency,
      throughput: {
        bytesPerSecond: (totalBytes / duration) * 1000,
        requestsPerSecond: (stats.totalRequests / duration) * 1000,
      },
      errors: stats.errors,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
    };
  }

  private reset(): void {
    this.latencyTracker.clear();
    this.requestGenerator.reset();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Result Formatter
 */
export class ResultFormatter {
  static format(result: BenchmarkResult): string {
    const lines: string[] = [];

    lines.push("=".repeat(80));
    lines.push("BENCHMARK RESULTS");
    lines.push("=".repeat(80));
    lines.push("");

    lines.push("Summary:");
    lines.push(`  Total Requests:       ${result.totalRequests.toLocaleString()}`);
    lines.push(`  Successful:           ${result.successfulRequests.toLocaleString()}`);
    lines.push(`  Failed:               ${result.failedRequests.toLocaleString()}`);
    lines.push(`  Duration:             ${(result.duration / 1000).toFixed(2)}s`);
    lines.push(
      `  Requests/sec:         ${result.requestsPerSecond.toFixed(2)}`,
    );
    lines.push("");

    lines.push("Latency:");
    lines.push(`  Min:                  ${result.latency.min.toFixed(2)}ms`);
    lines.push(`  Max:                  ${result.latency.max.toFixed(2)}ms`);
    lines.push(`  Mean:                 ${result.latency.mean.toFixed(2)}ms`);
    lines.push(`  Median:               ${result.latency.median.toFixed(2)}ms`);
    lines.push(`  95th percentile:      ${result.latency.p95.toFixed(2)}ms`);
    lines.push(`  99th percentile:      ${result.latency.p99.toFixed(2)}ms`);
    lines.push(`  Std Dev:              ${result.latency.stdDev.toFixed(2)}ms`);
    lines.push("");

    lines.push("Throughput:");
    lines.push(
      `  Bytes/sec:            ${this.formatBytes(result.throughput.bytesPerSecond)}/s`,
    );
    lines.push(
      `  Requests/sec:         ${result.throughput.requestsPerSecond.toFixed(2)}`,
    );
    lines.push("");

    if (Object.keys(result.errors).length > 0) {
      lines.push("Errors:");
      for (const [type, count] of Object.entries(result.errors)) {
        lines.push(`  ${type}:                ${count.toLocaleString()}`);
      }
      lines.push("");
    }

    if (result.memoryUsage) {
      lines.push("Memory Usage:");
      lines.push(
        `  Heap Used:            ${this.formatBytes(result.memoryUsage.heapUsed)}`,
      );
      lines.push(
        `  Heap Total:           ${this.formatBytes(result.memoryUsage.heapTotal)}`,
      );
      lines.push(
        `  External:             ${this.formatBytes(result.memoryUsage.external)}`,
      );
      lines.push(`  RSS:                  ${this.formatBytes(result.memoryUsage.rss)}`);
      lines.push("");
    }

    lines.push("=".repeat(80));

    return lines.join("\n");
  }

  static formatComparison(results: BenchmarkResult[]): string {
    const lines: string[] = [];

    lines.push("=".repeat(80));
    lines.push("BENCHMARK COMPARISON");
    lines.push("=".repeat(80));
    lines.push("");

    const header = [
      "Concurrency",
      "RPS",
      "Mean Latency",
      "P95",
      "P99",
      "Errors",
    ];
    lines.push(header.map((h) => h.padEnd(15)).join(""));
    lines.push("-".repeat(80));

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const row = [
        `${i + 1}`,
        r.requestsPerSecond.toFixed(2),
        `${r.latency.mean.toFixed(2)}ms`,
        `${r.latency.p95.toFixed(2)}ms`,
        `${r.latency.p99.toFixed(2)}ms`,
        r.failedRequests.toString(),
      ];
      lines.push(row.map((c) => c.padEnd(15)).join(""));
    }

    lines.push("=".repeat(80));

    return lines.join("\n");
  }

  private static formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Example Usage
 */
async function exampleUsage() {
  // Mock handler that simulates API gateway processing
  const mockHandler = async () => {
    // Simulate processing time
    const processingTime = Math.random() * 10;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    // Simulate occasional errors
    if (Math.random() < 0.01) {
      return { status: 500, error: "Internal Server Error" };
    }

    return {
      status: 200,
      data: { message: "Success", timestamp: Date.now() },
    };
  };

  // Test 1: Constant rate
  console.log("Test 1: Constant Rate Benchmark");
  const constantRateBenchmark = new ThroughputBenchmark({
    duration: 30000, // 30 seconds
    concurrency: 10,
    requestsPerSecond: 100,
    warmupDuration: 5000,
  });

  const constantRateResult = await constantRateBenchmark.runConstantRate(
    mockHandler,
  );
  console.log(ResultFormatter.format(constantRateResult));

  // Test 2: Concurrent requests
  console.log("\nTest 2: Concurrent Request Benchmark");
  const concurrentBenchmark = new ThroughputBenchmark({
    duration: 30000,
    concurrency: 50,
    warmupDuration: 5000,
  });

  const concurrentResult = await concurrentBenchmark.runConcurrent(mockHandler);
  console.log(ResultFormatter.format(concurrentResult));

  // Test 3: Step load
  console.log("\nTest 3: Step Load Test");
  const stepLoadBenchmark = new ThroughputBenchmark({
    duration: 15000,
    concurrency: 10,
    warmupDuration: 5000,
  });

  const stepLoadResults = await stepLoadBenchmark.runStepLoad(mockHandler, [
    10, 25, 50, 100,
  ]);
  console.log(ResultFormatter.formatComparison(stepLoadResults));

  // Test 4: Spike test
  console.log("\nTest 4: Spike Test");
  const spikeBenchmark = new ThroughputBenchmark({
    duration: 20000,
    concurrency: 10,
    warmupDuration: 5000,
  });

  const spikeResults = await spikeBenchmark.runSpikeTest(
    mockHandler,
    20, // Normal concurrency
    200, // Spike concurrency
    10000, // Spike duration
  );

  console.log("\nNormal Phase:");
  console.log(ResultFormatter.format(spikeResults.normalPhase));
  console.log("\nSpike Phase:");
  console.log(ResultFormatter.format(spikeResults.spikePhase));
  console.log("\nRecovery Phase:");
  console.log(ResultFormatter.format(spikeResults.recoveryPhase));
}

// Run if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export default ThroughputBenchmark;
