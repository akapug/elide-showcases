/**
 * Performance Benchmarks
 *
 * Comprehensive performance testing and benchmarking for
 * video processing pipeline and effects.
 */

import { VideoProcessor } from '../src/server';
import { FilterEngine } from '../src/effects/filter-engine';
import { FaceDetector } from '../src/effects/face-detection';
import { ObjectTracker } from '../src/effects/object-tracking';
import { StyleTransfer } from '../src/effects/style-transfer';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  fps: number;
  memoryUsed: number;
}

/**
 * Benchmark runner class
 */
class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark
   */
  async run(
    name: string,
    iterations: number,
    testFn: () => Promise<void>
  ): Promise<BenchmarkResult> {
    console.log(`\nRunning benchmark: ${name}`);
    console.log(`Iterations: ${iterations}`);

    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    // Warm-up
    await testFn();

    // Run benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFn();
      const end = performance.now();

      times.push(end - start);

      // Progress indicator
      if ((i + 1) % Math.floor(iterations / 10) === 0) {
        process.stdout.write('.');
      }
    }

    const memoryAfter = process.memoryUsage().heapUsed;

    console.log(); // New line after progress

    const totalTime = times.reduce((a, b) => a + b, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const fps = 1000 / averageTime;
    const memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024; // MB

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      fps,
      memoryUsed
    };

    this.results.push(result);

    console.log(`Average Time: ${averageTime.toFixed(2)}ms`);
    console.log(`Min Time: ${minTime.toFixed(2)}ms`);
    console.log(`Max Time: ${maxTime.toFixed(2)}ms`);
    console.log(`FPS: ${fps.toFixed(2)}`);
    console.log(`Memory Used: ${memoryUsed.toFixed(2)}MB`);

    return result;
  }

  /**
   * Print summary of all benchmarks
   */
  printSummary(): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Benchmark Summary                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('┌────────────────────────────┬──────────┬──────────┬─────────┐');
    console.log('│ Benchmark                  │ Avg (ms) │ FPS      │ Mem(MB) │');
    console.log('├────────────────────────────┼──────────┼──────────┼─────────┤');

    for (const result of this.results) {
      const name = result.name.padEnd(26);
      const avg = result.averageTime.toFixed(2).padStart(8);
      const fps = result.fps.toFixed(2).padStart(8);
      const mem = result.memoryUsed.toFixed(2).padStart(7);

      console.log(`│ ${name} │ ${avg} │ ${fps} │ ${mem} │`);
    }

    console.log('└────────────────────────────┴──────────┴──────────┴─────────┘\n');
  }

  /**
   * Get results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

/**
 * Benchmark 1: Basic Filter Performance
 */
async function benchmark1_basicFilters() {
  const runner = new BenchmarkRunner();

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080
  });

  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  // Gaussian Blur
  await runner.run('Gaussian Blur (15x15)', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'gaussian-blur',
      kernelSize: 15,
      sigma: 3
    });
  });

  // Sharpen
  await runner.run('Sharpen Filter', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'sharpen',
      amount: 1.0
    });
  });

  // Edge Detection
  await runner.run('Edge Detection (Sobel)', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'edge-detection',
      method: 'sobel'
    });
  });

  // Brightness/Contrast
  await runner.run('Brightness/Contrast', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'brightness-contrast',
      brightness: 20,
      contrast: 1.3
    });
  });

  runner.printSummary();
  return runner.getResults();
}

/**
 * Benchmark 2: Color Grading Performance
 */
async function benchmark2_colorGrading() {
  const runner = new BenchmarkRunner();

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080
  });

  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  // Cinematic Warm
  await runner.run('Color Grade: Cinematic Warm', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'color-grade',
      preset: 'cinematic-warm',
      intensity: 0.8
    });
  });

  // Cinematic Cool
  await runner.run('Color Grade: Cinematic Cool', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'color-grade',
      preset: 'cinematic-cool',
      intensity: 0.8
    });
  });

  // Vintage
  await runner.run('Color Grade: Vintage', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'color-grade',
      preset: 'vintage',
      intensity: 0.8
    });
  });

  runner.printSummary();
  return runner.getResults();
}

/**
 * Benchmark 3: Artistic Effects Performance
 */
async function benchmark3_artisticEffects() {
  const runner = new BenchmarkRunner();

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080
  });

  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  // Cartoon Effect
  await runner.run('Cartoon Effect', 50, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'cartoon',
      edgeThickness: 2,
      colorReduction: 8
    });
  });

  // Oil Painting
  await runner.run('Oil Painting Effect', 20, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'oil-painting',
      radius: 5,
      levels: 20
    });
  });

  // Vignette
  await runner.run('Vignette Effect', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'vignette',
      intensity: 0.5,
      radius: 0.8
    });
  });

  runner.printSummary();
  return runner.getResults();
}

/**
 * Benchmark 4: Resolution Comparison
 */
async function benchmark4_resolutionComparison() {
  const runner = new BenchmarkRunner();

  const resolutions = [
    { width: 640, height: 480, name: '480p (VGA)' },
    { width: 1280, height: 720, name: '720p (HD)' },
    { width: 1920, height: 1080, name: '1080p (Full HD)' },
    { width: 2560, height: 1440, name: '1440p (2K)' },
    { width: 3840, height: 2160, name: '2160p (4K)' }
  ];

  for (const res of resolutions) {
    const filterEngine = new FilterEngine({
      width: res.width,
      height: res.height
    });

    const mockFrame = {
      data: Buffer.alloc(res.width * res.height * 4),
      width: res.width,
      height: res.height,
      timestamp: Date.now(),
      format: 'rgb24'
    };

    await runner.run(`Gaussian Blur @ ${res.name}`, 50, async () => {
      await filterEngine.apply(mockFrame, {
        filterType: 'gaussian-blur',
        kernelSize: 15,
        sigma: 3
      });
    });
  }

  runner.printSummary();
  return runner.getResults();
}

/**
 * Benchmark 5: Effect Chaining
 */
async function benchmark5_effectChaining() {
  const runner = new BenchmarkRunner();

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080
  });

  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  // Single Effect
  await runner.run('Single Effect', 100, async () => {
    await filterEngine.apply(mockFrame, {
      filterType: 'gaussian-blur',
      kernelSize: 15
    });
  });

  // Three Effects
  await runner.run('Three Effects Chain', 50, async () => {
    let result = mockFrame;

    result = await filterEngine.apply(result, {
      filterType: 'brightness-contrast',
      brightness: 10,
      contrast: 1.2
    });

    result = await filterEngine.apply(result, {
      filterType: 'color-grade',
      preset: 'cinematic-warm',
      intensity: 0.8
    });

    result = await filterEngine.apply(result, {
      filterType: 'vignette',
      intensity: 0.5
    });
  });

  // Five Effects
  await runner.run('Five Effects Chain', 30, async () => {
    let result = mockFrame;

    result = await filterEngine.apply(result, {
      filterType: 'brightness-contrast',
      brightness: 10,
      contrast: 1.2
    });

    result = await filterEngine.apply(result, {
      filterType: 'color-grade',
      preset: 'cinematic-warm',
      intensity: 0.8
    });

    result = await filterEngine.apply(result, {
      filterType: 'sharpen',
      amount: 0.5
    });

    result = await filterEngine.apply(result, {
      filterType: 'vignette',
      intensity: 0.5
    });

    result = await filterEngine.apply(result, {
      filterType: 'grain',
      intensity: 0.1
    });
  });

  runner.printSummary();
  return runner.getResults();
}

/**
 * Benchmark 6: Memory Usage
 */
async function benchmark6_memoryUsage() {
  console.log('\n=== Benchmark 6: Memory Usage ===\n');

  const iterations = 100;
  const measurements: number[] = [];

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080
  });

  console.log('Measuring memory usage over time...\n');

  for (let i = 0; i < iterations; i++) {
    const mockFrame = {
      data: Buffer.alloc(1920 * 1080 * 4),
      width: 1920,
      height: 1080,
      timestamp: Date.now(),
      format: 'rgb24'
    };

    await filterEngine.apply(mockFrame, {
      filterType: 'gaussian-blur',
      kernelSize: 15
    });

    const memUsage = process.memoryUsage();
    measurements.push(memUsage.heapUsed / 1024 / 1024);

    if ((i + 1) % 10 === 0) {
      process.stdout.write('.');
    }
  }

  console.log('\n');

  const avgMemory = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const maxMemory = Math.max(...measurements);
  const minMemory = Math.min(...measurements);

  console.log(`Average Memory: ${avgMemory.toFixed(2)} MB`);
  console.log(`Min Memory: ${minMemory.toFixed(2)} MB`);
  console.log(`Max Memory: ${maxMemory.toFixed(2)} MB`);
  console.log(`Memory Growth: ${(maxMemory - minMemory).toFixed(2)} MB`);
}

/**
 * Benchmark 7: Throughput Test
 */
async function benchmark7_throughput() {
  console.log('\n=== Benchmark 7: Throughput Test ===\n');

  const processor = new VideoProcessor({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high'
  });

  try {
    await processor.start();

    processor.applyEffect('filter', {
      filterType: 'gaussian-blur',
      kernelSize: 15
    });

    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    let framesProcessed = 0;

    console.log(`Processing frames for ${duration / 1000} seconds...\n`);

    while (Date.now() - startTime < duration) {
      const mockFrame = Buffer.alloc(1920 * 1080 * 4);
      processor.processFrame(mockFrame);
      framesProcessed++;

      if (framesProcessed % 30 === 0) {
        process.stdout.write('.');
      }
    }

    console.log('\n');

    const stats = processor.getStats();
    const actualDuration = (Date.now() - startTime) / 1000;

    console.log(`Frames Processed: ${framesProcessed}`);
    console.log(`Duration: ${actualDuration.toFixed(2)}s`);
    console.log(`Throughput: ${(framesProcessed / actualDuration).toFixed(2)} FPS`);
    console.log(`Average FPS: ${stats.averageFps.toFixed(2)}`);
    console.log(`Dropped Frames: ${stats.droppedFrames}`);

    await processor.stop();
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Benchmark 8: Concurrent Processing
 */
async function benchmark8_concurrent() {
  console.log('\n=== Benchmark 8: Concurrent Processing ===\n');

  const concurrencyLevels = [1, 2, 4, 8];

  for (const level of concurrencyLevels) {
    console.log(`\nTesting concurrency level: ${level}`);

    const startTime = Date.now();
    const promises: Promise<void>[] = [];

    for (let i = 0; i < level; i++) {
      const filterEngine = new FilterEngine({
        width: 1920,
        height: 1080
      });

      const promise = (async () => {
        for (let j = 0; j < 50; j++) {
          const mockFrame = {
            data: Buffer.alloc(1920 * 1080 * 4),
            width: 1920,
            height: 1080,
            timestamp: Date.now(),
            format: 'rgb24'
          };

          await filterEngine.apply(mockFrame, {
            filterType: 'gaussian-blur',
            kernelSize: 15
          });
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    const totalFrames = level * 50;
    const fps = (totalFrames / duration) * 1000;

    console.log(`Total Frames: ${totalFrames}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Throughput: ${fps.toFixed(2)} FPS`);
  }
}

/**
 * Main function to run all benchmarks
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Video AI Effects Platform Benchmarks ║');
  console.log('║      Performance Testing Suite         ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await benchmark1_basicFilters();
    await benchmark2_colorGrading();
    await benchmark3_artisticEffects();
    await benchmark4_resolutionComparison();
    await benchmark5_effectChaining();
    await benchmark6_memoryUsage();
    await benchmark7_throughput();
    await benchmark8_concurrent();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  All Benchmarks Completed Successfully ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Error running benchmarks:', error);
    process.exit(1);
  }
}

// Run benchmarks if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  BenchmarkRunner,
  benchmark1_basicFilters,
  benchmark2_colorGrading,
  benchmark3_artisticEffects,
  benchmark4_resolutionComparison,
  benchmark5_effectChaining,
  benchmark6_memoryUsage,
  benchmark7_throughput,
  benchmark8_concurrent
};
