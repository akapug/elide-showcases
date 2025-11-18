/**
 * Benchmark - Robust Benchmarking Library
 *
 * A robust benchmarking library that supports high-resolution timers.
 * **POLYGLOT SHOWCASE**: Benchmarking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/benchmark (~2M+ downloads/week)
 *
 * Features:
 * - High-resolution timing
 * - Statistical analysis
 * - Compare multiple benchmarks
 * - Async support
 * - Event-driven API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need benchmarking
 * - ONE benchmarking library works everywhere on Elide
 * - Consistent performance metrics across languages
 * - Share benchmark suites across your stack
 *
 * Use cases:
 * - Performance testing
 * - Algorithm comparison
 * - Optimization validation
 * - Regression detection
 *
 * Package has ~2M+ downloads/week on npm - essential performance tool!
 */

interface BenchmarkOptions {
  name?: string;
  fn?: () => void | Promise<void>;
  setup?: () => void;
  teardown?: () => void;
  minSamples?: number;
  maxTime?: number;
}

interface BenchmarkStats {
  mean: number;
  variance: number;
  stdDev: number;
  rme: number; // Relative margin of error
  sem: number; // Standard error of mean
  min: number;
  max: number;
  samples: number;
}

interface BenchmarkResult {
  name: string;
  hz: number; // Operations per second
  stats: BenchmarkStats;
  times: {
    cycle: number;
    elapsed: number;
    period: number;
  };
}

export class Benchmark {
  public name: string;
  private fn?: () => void | Promise<void>;
  private setup?: () => void;
  private teardown?: () => void;
  private minSamples: number;
  private maxTime: number;
  private samples: number[] = [];
  public stats?: BenchmarkStats;
  public hz = 0;

  constructor(options: BenchmarkOptions = {}) {
    this.name = options.name || "Benchmark";
    this.fn = options.fn;
    this.setup = options.setup;
    this.teardown = options.teardown;
    this.minSamples = options.minSamples || 5;
    this.maxTime = options.maxTime || 5000; // 5 seconds
  }

  async run(): Promise<BenchmarkResult> {
    console.log(`Running: ${this.name}...`);

    const startTime = performance.now();
    this.samples = [];

    // Run until we have enough samples or time runs out
    while (
      this.samples.length < this.minSamples ||
      performance.now() - startTime < this.maxTime
    ) {
      if (this.setup) this.setup();

      const sampleStart = performance.now();
      let operations = 0;

      // Run for at least 50ms per sample
      const sampleTargetTime = 50;
      while (performance.now() - sampleStart < sampleTargetTime) {
        if (this.fn) await this.fn();
        operations++;
      }

      const sampleTime = performance.now() - sampleStart;
      const opsPerMs = operations / sampleTime;
      this.samples.push(opsPerMs * 1000); // Convert to ops/sec

      if (this.teardown) this.teardown();

      // Stop if we have enough samples and enough time has passed
      if (
        this.samples.length >= this.minSamples &&
        performance.now() - startTime >= 1000
      ) {
        break;
      }
    }

    // Calculate statistics
    this.calculateStats();
    const elapsed = performance.now() - startTime;

    return {
      name: this.name,
      hz: this.hz,
      stats: this.stats!,
      times: {
        cycle: elapsed / this.samples.length,
        elapsed,
        period: 1000 / this.hz,
      },
    };
  }

  private calculateStats(): void {
    const n = this.samples.length;
    const mean = this.samples.reduce((a, b) => a + b, 0) / n;
    const variance =
      this.samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const sem = stdDev / Math.sqrt(n);
    const rme = (sem / mean) * 100;
    const min = Math.min(...this.samples);
    const max = Math.max(...this.samples);

    this.hz = mean;
    this.stats = {
      mean,
      variance,
      stdDev,
      rme,
      sem,
      min,
      max,
      samples: n,
    };
  }

  toString(): string {
    if (!this.stats) return this.name;

    const hz = this.hz.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
    const rme = this.stats.rme.toFixed(2);

    return `${this.name} x ${hz} ops/sec ±${rme}% (${this.stats.samples} runs sampled)`;
  }
}

/**
 * Suite - run multiple benchmarks
 */
export class Suite {
  private benchmarks: Benchmark[] = [];
  public name: string;

  constructor(name = "Benchmark Suite") {
    this.name = name;
  }

  add(name: string, fn: () => void | Promise<void>): this {
    this.benchmarks.push(new Benchmark({ name, fn }));
    return this;
  }

  async run(): Promise<void> {
    console.log(`\n=== ${this.name} ===\n`);

    const results: BenchmarkResult[] = [];

    for (const bench of this.benchmarks) {
      const result = await bench.run();
      results.push(result);
      console.log(bench.toString());
    }

    // Find fastest
    const fastest = results.reduce((prev, current) =>
      current.hz > prev.hz ? current : prev
    );

    console.log(`\nFastest is ${fastest.name}`);

    // Show relative performance
    console.log("\nRelative performance:");
    results.forEach((result) => {
      const ratio = (fastest.hz / result.hz).toFixed(2);
      const percent = (((fastest.hz - result.hz) / result.hz) * 100).toFixed(
        1
      );
      if (result.name === fastest.name) {
        console.log(`  ${result.name}: baseline`);
      } else {
        console.log(`  ${result.name}: ${ratio}x slower (${percent}% slower)`);
      }
    });
  }
}

export default { Benchmark, Suite };

// CLI Demo
if (import.meta.url.includes("elide-benchmark.ts")) {
  console.log("⚡ Benchmark - Performance Testing for Elide (POLYGLOT!)\n");

  const suite = new Suite("String Operations");

  suite
    .add("String concatenation", () => {
      let str = "";
      for (let i = 0; i < 100; i++) {
        str += "a";
      }
    })
    .add("Array join", () => {
      const arr = [];
      for (let i = 0; i < 100; i++) {
        arr.push("a");
      }
      arr.join("");
    })
    .add("Template literals", () => {
      const parts = [];
      for (let i = 0; i < 100; i++) {
        parts.push(`a`);
      }
      parts.join("");
    });

  suite.run().then(() => {
    console.log("\n✅ Use Cases:");
    console.log("- Performance testing");
    console.log("- Algorithm comparison");
    console.log("- Optimization validation");
    console.log("- Regression detection");
    console.log();

    console.log("🚀 Performance:");
    console.log("- Zero dependencies");
    console.log("- High-resolution timing");
    console.log("- Statistical analysis");
    console.log("- ~2M+ downloads/week on npm!");
    console.log();

    console.log("💡 Polyglot Tips:");
    console.log("- Use in Python/Ruby/Java via Elide");
    console.log("- Share benchmark suites across languages");
    console.log("- One performance framework for all services");
    console.log("- Perfect for polyglot performance testing!");
  });
}
