/**
 * Performance Benchmarks
 *
 * Benchmarking suite to compare Elide Build against other tools
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { Bundler } from '../bundler/index';
import { ProductionBuilder } from '../production/index';
import { Compiler } from '../compiler/index';
import { Optimizer } from '../optimizer/index';

export interface BenchmarkResult {
  name: string;
  duration: number;
  memory: number;
  cacheHits?: number;
  cacheMisses?: number;
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    medianDuration: number;
    minDuration: number;
    maxDuration: number;
  };
}

/**
 * Benchmark runner
 */
export class BenchmarkRunner {
  private results: Map<string, BenchmarkResult[]> = new Map();

  /**
   * Run a benchmark
   */
  async benchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    const durations: number[] = [];
    const memories: number[] = [];

    // Warmup
    await fn();

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const memBefore = process.memoryUsage().heapUsed;
      const start = performance.now();

      await fn();

      const duration = performance.now() - start;
      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = memAfter - memBefore;

      durations.push(duration);
      memories.push(memUsed);

      // Force GC if available
      if (global.gc) {
        global.gc();
      }
    }

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgMemory = memories.reduce((a, b) => a + b, 0) / memories.length;

    const result: BenchmarkResult = {
      name,
      duration: avgDuration,
      memory: avgMemory,
    };

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(result);

    return result;
  }

  /**
   * Get summary statistics
   */
  getSummary(name: string): BenchmarkSuite['summary'] {
    const results = this.results.get(name) || [];
    const durations = results.map((r) => r.duration);

    return {
      totalDuration: durations.reduce((a, b) => a + b, 0),
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianDuration: this.median(durations),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }

  /**
   * Calculate median
   */
  private median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  /**
   * Print results
   */
  printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK RESULTS');
    console.log('='.repeat(80) + '\n');

    for (const [name, results] of this.results) {
      const summary = this.getSummary(name);

      console.log(`${name}:`);
      console.log(`  Average: ${summary.averageDuration.toFixed(2)}ms`);
      console.log(`  Median:  ${summary.medianDuration.toFixed(2)}ms`);
      console.log(`  Min:     ${summary.minDuration.toFixed(2)}ms`);
      console.log(`  Max:     ${summary.maxDuration.toFixed(2)}ms`);
      console.log();
    }
  }

  /**
   * Export results as JSON
   */
  exportJSON(filepath: string): void {
    const data: Record<string, any> = {};

    for (const [name, results] of this.results) {
      data[name] = {
        results,
        summary: this.getSummary(name),
      };
    }

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  /**
   * Export results as HTML
   */
  exportHTML(filepath: string): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Benchmark Results</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 50px auto; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .chart { height: 300px; margin: 30px 0; }
  </style>
</head>
<body>
  <h1>Benchmark Results</h1>
  ${this.generateHTMLTable()}
  ${this.generateHTMLChart()}
  <p>Generated at ${new Date().toLocaleString()}</p>
</body>
</html>
    `.trim();

    fs.writeFileSync(filepath, html);
  }

  /**
   * Generate HTML table
   */
  private generateHTMLTable(): string {
    let html = '<table><thead><tr><th>Benchmark</th><th>Avg</th><th>Median</th><th>Min</th><th>Max</th></tr></thead><tbody>';

    for (const [name] of this.results) {
      const summary = this.getSummary(name);
      html += `
        <tr>
          <td>${name}</td>
          <td>${summary.averageDuration.toFixed(2)}ms</td>
          <td>${summary.medianDuration.toFixed(2)}ms</td>
          <td>${summary.minDuration.toFixed(2)}ms</td>
          <td>${summary.maxDuration.toFixed(2)}ms</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    return html;
  }

  /**
   * Generate HTML chart
   */
  private generateHTMLChart(): string {
    return `
      <div class="chart">
        <canvas id="chart"></canvas>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ${JSON.stringify(Array.from(this.results.keys()))},
            datasets: [{
              label: 'Average Duration (ms)',
              data: ${JSON.stringify(Array.from(this.results.keys()).map((k) => this.getSummary(k).averageDuration))},
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      </script>
    `;
  }
}

/**
 * Bundler benchmarks
 */
export async function benchmarkBundler(): Promise<void> {
  const runner = new BenchmarkRunner();

  console.log('Running bundler benchmarks...\n');

  // Small project (10 modules)
  await runner.benchmark('Small Project (10 modules)', async () => {
    const bundler = new Bundler({
      entry: 'test/fixtures/small/index.ts',
      outDir: 'test/output/small',
      minify: false,
    });
    await bundler.build();
  });

  // Medium project (100 modules)
  await runner.benchmark('Medium Project (100 modules)', async () => {
    const bundler = new Bundler({
      entry: 'test/fixtures/medium/index.ts',
      outDir: 'test/output/medium',
      minify: false,
    });
    await bundler.build();
  });

  // Large project (1000 modules)
  await runner.benchmark('Large Project (1000 modules)', async () => {
    const bundler = new Bundler({
      entry: 'test/fixtures/large/index.ts',
      outDir: 'test/output/large',
      minify: false,
    });
    await bundler.build();
  });

  // With optimization
  await runner.benchmark('Large Project (optimized)', async () => {
    const bundler = new Bundler({
      entry: 'test/fixtures/large/index.ts',
      outDir: 'test/output/large-opt',
      minify: true,
      treeshake: true,
      splitting: true,
    });
    await bundler.build();
  });

  runner.printResults();
  runner.exportJSON('benchmarks/bundler-results.json');
  runner.exportHTML('benchmarks/bundler-results.html');
}

/**
 * Compiler benchmarks
 */
export async function benchmarkCompiler(): Promise<void> {
  const runner = new BenchmarkRunner();

  console.log('Running compiler benchmarks...\n');

  const compiler = new Compiler({
    target: 'es2020',
    sourceMap: false,
  });

  // TypeScript compilation
  await runner.benchmark('TypeScript Compilation', async () => {
    const code = fs.readFileSync('test/fixtures/sample.ts', 'utf-8');
    await compiler.compile(code, 'sample.ts');
  });

  // JSX transformation
  await runner.benchmark('JSX Transformation', async () => {
    const code = fs.readFileSync('test/fixtures/sample.jsx', 'utf-8');
    await compiler.compile(code, 'sample.jsx');
  });

  // ES transformation
  await runner.benchmark('ES Transformation', async () => {
    const code = fs.readFileSync('test/fixtures/sample.js', 'utf-8');
    await compiler.compile(code, 'sample.js');
  });

  runner.printResults();
  runner.exportJSON('benchmarks/compiler-results.json');
  runner.exportHTML('benchmarks/compiler-results.html');
}

/**
 * Optimizer benchmarks
 */
export async function benchmarkOptimizer(): Promise<void> {
  const runner = new BenchmarkRunner();

  console.log('Running optimizer benchmarks...\n');

  const optimizer = new Optimizer({
    minify: true,
    compress: true,
  });

  // JavaScript minification
  await runner.benchmark('JavaScript Minification', async () => {
    const code = fs.readFileSync('test/fixtures/sample.js', 'utf-8');
    await optimizer.optimize(code, 'js');
  });

  // CSS minification
  await runner.benchmark('CSS Minification', async () => {
    const code = fs.readFileSync('test/fixtures/sample.css', 'utf-8');
    await optimizer.optimize(code, 'css');
  });

  // HTML minification
  await runner.benchmark('HTML Minification', async () => {
    const code = fs.readFileSync('test/fixtures/sample.html', 'utf-8');
    await optimizer.optimize(code, 'html');
  });

  runner.printResults();
  runner.exportJSON('benchmarks/optimizer-results.json');
  runner.exportHTML('benchmarks/optimizer-results.html');
}

/**
 * Run all benchmarks
 */
export async function runAllBenchmarks(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('ELIDE BUILD - PERFORMANCE BENCHMARKS');
  console.log('='.repeat(80) + '\n');

  await benchmarkBundler();
  await benchmarkCompiler();
  await benchmarkOptimizer();

  console.log('\n✅ All benchmarks complete!\n');
}

// Run if called directly
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}
