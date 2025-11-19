/**
 * Performance Benchmarks
 *
 * Comprehensive performance benchmarks comparing TypeScript implementations
 * with Python scientific stack operations through Elide bridge.
 *
 * Measures:
 * - Execution time
 * - Memory usage
 * - Throughput
 * - Overhead of bridge operations
 */

import { LinearAlgebra } from '../src/compute/linear-algebra';
import { Statistics } from '../src/compute/statistics';
import { SignalProcessing } from '../src/compute/signal-processing';
import { Optimization } from '../src/compute/optimization';
import Python from 'python';

interface BenchmarkResult {
  name: string;
  timeMs: number;
  iterations: number;
  avgTimeMs: number;
  opsPerSec: number;
  memoryMB?: number;
}

interface ComparisonResult {
  operation: string;
  typescriptMs: number;
  pythonBridgeMs: number;
  speedup: number;
  winner: 'TypeScript' | 'Python Bridge';
}

export class PerformanceBenchmarks {
  private linalg: LinearAlgebra;
  private stats: Statistics;
  private signal: SignalProcessing;
  private optimize: Optimization;
  private numpy: any;

  constructor() {
    this.linalg = new LinearAlgebra();
    this.stats = new Statistics();
    this.signal = new SignalProcessing();
    this.optimize = new Optimization();
    this.numpy = Python.import('numpy');
  }

  // ==========================================================================
  // Benchmark Utilities
  // ==========================================================================

  private benchmark(name: string, fn: () => void, iterations: number = 100): BenchmarkResult {
    // Warm-up
    for (let i = 0; i < 5; i++) {
      fn();
    }

    // Measure memory before
    const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

    // Benchmark
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const endTime = Date.now();

    // Measure memory after
    const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    const opsPerSec = 1000 / avgTime;

    return {
      name,
      timeMs: totalTime,
      iterations,
      avgTimeMs: avgTime,
      opsPerSec,
      memoryMB: memAfter - memBefore
    };
  }

  private compare(
    operation: string,
    tsFn: () => void,
    pyFn: () => void,
    iterations: number = 100
  ): ComparisonResult {
    const tsResult = this.benchmark(operation + ' (TS)', tsFn, iterations);
    const pyResult = this.benchmark(operation + ' (Python)', pyFn, iterations);

    const speedup = tsResult.avgTimeMs / pyResult.avgTimeMs;

    return {
      operation,
      typescriptMs: tsResult.avgTimeMs,
      pythonBridgeMs: pyResult.avgTimeMs,
      speedup: Math.abs(speedup),
      winner: speedup > 1 ? 'Python Bridge' : 'TypeScript'
    };
  }

  // ==========================================================================
  // Linear Algebra Benchmarks
  // ==========================================================================

  benchmarkMatrixMultiplication(): BenchmarkResult[] {
    const sizes = [10, 50, 100, 500, 1000];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const A = Array(size).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );
      const B = Array(size).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );

      const result = this.benchmark(
        `Matrix Multiplication ${size}x${size}`,
        () => {
          this.linalg.matmul(A, B);
        },
        size > 500 ? 10 : 50
      );

      results.push(result);
    }

    return results;
  }

  benchmarkEigendecomposition(): BenchmarkResult[] {
    const sizes = [10, 50, 100, 200, 500];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const A = Array(size).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );

      const result = this.benchmark(
        `Eigendecomposition ${size}x${size}`,
        () => {
          this.linalg.eig(A);
        },
        size > 200 ? 5 : 20
      );

      results.push(result);
    }

    return results;
  }

  benchmarkSVD(): BenchmarkResult[] {
    const sizes = [10, 50, 100, 200, 500];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const A = Array(size).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );

      const result = this.benchmark(
        `SVD ${size}x${size}`,
        () => {
          this.linalg.svd(A);
        },
        size > 200 ? 5 : 20
      );

      results.push(result);
    }

    return results;
  }

  benchmarkLinearSolve(): BenchmarkResult[] {
    const sizes = [10, 50, 100, 200, 500];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const A = Array(size).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );
      const b = Array(size).fill(0).map(() => Math.random());

      const result = this.benchmark(
        `Linear Solve ${size}x${size}`,
        () => {
          this.linalg.solve(A, b);
        },
        size > 200 ? 10 : 30
      );

      results.push(result);
    }

    return results;
  }

  // ==========================================================================
  // Statistical Benchmarks
  // ==========================================================================

  benchmarkDescriptiveStats(): BenchmarkResult[] {
    const sizes = [100, 1000, 10000, 100000, 1000000];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const data = Array(size).fill(0).map(() => Math.random());

      const result = this.benchmark(
        `Descriptive Statistics (n=${size})`,
        () => {
          this.stats.describe(data);
        },
        size > 100000 ? 10 : 50
      );

      results.push(result);
    }

    return results;
  }

  benchmarkCorrelation(): BenchmarkResult[] {
    const sizes = [10, 50, 100, 200];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const data = Array(100).fill(0).map(() =>
        Array(size).fill(0).map(() => Math.random())
      );

      const result = this.benchmark(
        `Correlation Matrix ${size} features`,
        () => {
          this.stats.correlationMatrix(data);
        },
        30
      );

      results.push(result);
    }

    return results;
  }

  benchmarkHypothesisTesting(): BenchmarkResult {
    const data1 = Array(10000).fill(0).map(() => Math.random());
    const data2 = Array(10000).fill(0).map(() => Math.random() + 0.1);

    return this.benchmark(
      'T-Test (n=10000)',
      () => {
        this.stats.ttest(data1, data2);
      },
      100
    );
  }

  // ==========================================================================
  // Signal Processing Benchmarks
  // ==========================================================================

  benchmarkFFT(): BenchmarkResult[] {
    const sizes = [128, 512, 1024, 4096, 16384, 65536];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const signal = Array(size).fill(0).map(() => Math.random());

      const result = this.benchmark(
        `FFT (n=${size})`,
        () => {
          this.signal.fft(signal);
        },
        size > 16384 ? 10 : 50
      );

      results.push(result);
    }

    return results;
  }

  benchmarkFiltering(): BenchmarkResult[] {
    const sizes = [1000, 10000, 100000, 1000000];
    const results: BenchmarkResult[] = [];

    for (const size of sizes) {
      const signal = Array(size).fill(0).map(() => Math.random());

      const result = this.benchmark(
        `Butterworth Filter (n=${size})`,
        () => {
          this.signal.butterFilter(signal, {
            order: 4,
            cutoff: 0.2,
            filterType: 'lowpass'
          });
        },
        size > 100000 ? 5 : 20
      );

      results.push(result);
    }

    return results;
  }

  benchmarkWelch(): BenchmarkResult {
    const signal = Array(100000).fill(0).map(() => Math.random());

    return this.benchmark(
      'Welch PSD Estimation (n=100000)',
      () => {
        this.signal.welch(signal, 1000);
      },
      20
    );
  }

  // ==========================================================================
  // Optimization Benchmarks
  // ==========================================================================

  benchmarkOptimization(): BenchmarkResult[] {
    const results: BenchmarkResult[] = [];

    // Rosenbrock function
    const rosenbrock = (x: number[]) => {
      return (1 - x[0]) ** 2 + 100 * (x[1] - x[0] ** 2) ** 2;
    };

    const methods: Array<'BFGS' | 'Nelder-Mead' | 'CG'> = ['BFGS', 'Nelder-Mead', 'CG'];

    for (const method of methods) {
      const result = this.benchmark(
        `Optimization (${method})`,
        () => {
          this.optimize.minimize(rosenbrock, [0, 0], method);
        },
        10
      );

      results.push(result);
    }

    return results;
  }

  benchmarkCurveFitting(): BenchmarkResult {
    const xdata = Array(1000).fill(0).map((_, i) => i / 100);
    const ydata = xdata.map(x => 2 * Math.exp(-0.5 * x) + Math.random() * 0.1);

    const model = (x: number, a: number, b: number) => a * Math.exp(b * x);

    return this.benchmark(
      'Curve Fitting (n=1000)',
      () => {
        this.optimize.curveFit(model, xdata, ydata, [1, -0.5]);
      },
      20
    );
  }

  // ==========================================================================
  // Comparison Benchmarks
  // ==========================================================================

  compareArrayOperations(): ComparisonResult[] {
    const size = 100000;
    const arr1 = Array(size).fill(0).map(() => Math.random());
    const arr2 = Array(size).fill(0).map(() => Math.random());

    const npArr1 = this.numpy.array(arr1);
    const npArr2 = this.numpy.array(arr2);

    const results: ComparisonResult[] = [];

    // Addition
    results.push(this.compare(
      'Array Addition',
      () => {
        arr1.map((val, i) => val + arr2[i]);
      },
      () => {
        this.numpy.add(npArr1, npArr2);
      },
      100
    ));

    // Multiplication
    results.push(this.compare(
      'Array Multiplication',
      () => {
        arr1.map((val, i) => val * arr2[i]);
      },
      () => {
        this.numpy.multiply(npArr1, npArr2);
      },
      100
    ));

    // Sum
    results.push(this.compare(
      'Array Sum',
      () => {
        arr1.reduce((sum, val) => sum + val, 0);
      },
      () => {
        this.numpy.sum(npArr1);
      },
      100
    ));

    return results;
  }

  // ==========================================================================
  // Comprehensive Benchmark Suite
  // ==========================================================================

  runAllBenchmarks(): {
    linearAlgebra: BenchmarkResult[];
    statistics: BenchmarkResult[];
    signalProcessing: BenchmarkResult[];
    optimization: BenchmarkResult[];
    comparisons: ComparisonResult[];
  } {
    console.log('Running comprehensive benchmark suite...\n');

    console.log('Linear Algebra Benchmarks:');
    const matmul = this.benchmarkMatrixMultiplication();
    const eig = this.benchmarkEigendecomposition();
    const svd = this.benchmarkSVD();
    const solve = this.benchmarkLinearSolve();

    console.log('\nStatistical Benchmarks:');
    const stats = this.benchmarkDescriptiveStats();
    const corr = this.benchmarkCorrelation();
    const ttest = this.benchmarkHypothesisTesting();

    console.log('\nSignal Processing Benchmarks:');
    const fft = this.benchmarkFFT();
    const filter = this.benchmarkFiltering();
    const welch = this.benchmarkWelch();

    console.log('\nOptimization Benchmarks:');
    const optim = this.benchmarkOptimization();
    const curvefit = this.benchmarkCurveFitting();

    console.log('\nComparison Benchmarks:');
    const comparisons = this.compareArrayOperations();

    return {
      linearAlgebra: [...matmul, ...eig, ...svd, ...solve],
      statistics: [...stats, ...corr, ttest],
      signalProcessing: [...fft, ...filter, welch],
      optimization: [...optim, curvefit],
      comparisons
    };
  }

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  printResults(results: BenchmarkResult[]): void {
    console.log('\nBenchmark Results:');
    console.log('='.repeat(80));
    console.log(
      'Operation'.padEnd(40) +
      'Avg Time (ms)'.padEnd(15) +
      'Ops/sec'.padEnd(15) +
      'Memory (MB)'
    );
    console.log('-'.repeat(80));

    for (const result of results) {
      console.log(
        result.name.padEnd(40) +
        result.avgTimeMs.toFixed(2).padEnd(15) +
        result.opsPerSec.toFixed(2).padEnd(15) +
        (result.memoryMB?.toFixed(2) || 'N/A')
      );
    }

    console.log('='.repeat(80));
  }

  printComparisons(comparisons: ComparisonResult[]): void {
    console.log('\nComparison Results:');
    console.log('='.repeat(80));
    console.log(
      'Operation'.padEnd(30) +
      'TypeScript (ms)'.padEnd(18) +
      'Python (ms)'.padEnd(18) +
      'Speedup'.padEnd(14)
    );
    console.log('-'.repeat(80));

    for (const comp of comparisons) {
      const speedupStr = comp.winner === 'Python Bridge'
        ? `${comp.speedup.toFixed(1)}x faster`
        : `${(1 / comp.speedup).toFixed(1)}x slower`;

      console.log(
        comp.operation.padEnd(30) +
        comp.typescriptMs.toFixed(3).padEnd(18) +
        comp.pythonBridgeMs.toFixed(3).padEnd(18) +
        speedupStr
      );
    }

    console.log('='.repeat(80));
  }

  generateReport(): string {
    const results = this.runAllBenchmarks();

    let report = '# Scientific Computing Platform Performance Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Linear Algebra Performance\n\n';
    report += this.formatTable(results.linearAlgebra);

    report += '\n## Statistical Computing Performance\n\n';
    report += this.formatTable(results.statistics);

    report += '\n## Signal Processing Performance\n\n';
    report += this.formatTable(results.signalProcessing);

    report += '\n## Optimization Performance\n\n';
    report += this.formatTable(results.optimization);

    report += '\n## TypeScript vs Python Bridge Comparison\n\n';
    report += this.formatComparisonTable(results.comparisons);

    return report;
  }

  private formatTable(results: BenchmarkResult[]): string {
    let table = '| Operation | Avg Time (ms) | Ops/sec | Memory (MB) |\n';
    table += '|-----------|---------------|---------|-------------|\n';

    for (const result of results) {
      table += `| ${result.name} | ${result.avgTimeMs.toFixed(2)} | ${result.opsPerSec.toFixed(2)} | ${result.memoryMB?.toFixed(2) || 'N/A'} |\n`;
    }

    return table;
  }

  private formatComparisonTable(comparisons: ComparisonResult[]): string {
    let table = '| Operation | TypeScript (ms) | Python Bridge (ms) | Speedup | Winner |\n';
    table += '|-----------|-----------------|--------------------|---------|---------|\n';

    for (const comp of comparisons) {
      const speedup = comp.speedup.toFixed(1) + 'x';
      table += `| ${comp.operation} | ${comp.typescriptMs.toFixed(3)} | ${comp.pythonBridgeMs.toFixed(3)} | ${speedup} | ${comp.winner} |\n`;
    }

    return table;
  }
}

// CLI execution
export async function main(): Promise<void> {
  const benchmarks = new PerformanceBenchmarks();

  console.log('Scientific Computing Platform - Performance Benchmarks');
  console.log('='.repeat(80));
  console.log('');

  const results = benchmarks.runAllBenchmarks();

  benchmarks.printResults(results.linearAlgebra);
  benchmarks.printResults(results.statistics);
  benchmarks.printResults(results.signalProcessing);
  benchmarks.printResults(results.optimization);
  benchmarks.printComparisons(results.comparisons);

  // Generate markdown report
  const report = benchmarks.generateReport();
  console.log('\n\nMarkdown report generated. Save to file for documentation.');
}

if (require.main === module) {
  main().catch(console.error);
}

export default PerformanceBenchmarks;
