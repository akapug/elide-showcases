/**
 * Zero-Copy Benchmark
 *
 * Compares performance of zero-copy buffer sharing vs traditional serialization
 * for image processing operations.
 *
 * Metrics:
 * - Processing time
 * - Memory usage
 * - Throughput (images/second)
 * - Latency distribution
 *
 * @module benchmarks/zero-copy-benchmark
 */

import { randomBytes } from 'crypto';
import { BufferPool } from '../shared/buffer-pool';
import { MemoryManager } from '../shared/memory-manager';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsed: number;
  bufferPoolHits?: number;
  bufferPoolMisses?: number;
}

/**
 * Generate test image data
 */
function generateTestImage(width: number, height: number): Buffer {
  const size = width * height * 3; // RGB
  return randomBytes(size);
}

/**
 * Benchmark: Zero-Copy with Buffer Pool
 */
async function benchmarkZeroCopy(iterations: number, imageSize: number): Promise<BenchmarkResult> {
  const bufferPool = BufferPool.getInstance();
  bufferPool.resetStats();

  const times: number[] = [];
  const startMemory = process.memoryUsage().heapUsed;

  console.log(`Running zero-copy benchmark (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    // Acquire buffer from pool (zero-copy)
    const { id, buffer, reused } = bufferPool.acquire(imageSize);

    // Simulate image processing
    const testData = generateTestImage(1920, 1080);
    testData.copy(buffer, 0, 0, Math.min(testData.length, buffer.length));

    // Release buffer back to pool
    bufferPool.release(id);

    const elapsed = Date.now() - start;
    times.push(elapsed);

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
    }
  }

  console.log(''); // New line after progress

  const endMemory = process.memoryUsage().heapUsed;
  const stats = bufferPool.getStats();

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  return {
    name: 'Zero-Copy (Buffer Pool)',
    iterations,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    throughput: 1000 / avgTime,
    memoryUsed: endMemory - startMemory,
    bufferPoolHits: stats.hits,
    bufferPoolMisses: stats.misses,
  };
}

/**
 * Benchmark: Traditional Copy (Serialization)
 */
async function benchmarkTraditionalCopy(iterations: number, imageSize: number): Promise<BenchmarkResult> {
  const times: number[] = [];
  const startMemory = process.memoryUsage().heapUsed;

  console.log(`Running traditional copy benchmark (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    // Allocate new buffer every time (traditional approach)
    const buffer = Buffer.alloc(imageSize);

    // Simulate image processing
    const testData = generateTestImage(1920, 1080);
    testData.copy(buffer, 0, 0, Math.min(testData.length, buffer.length));

    // Serialize to JSON (traditional IPC)
    const serialized = JSON.stringify({
      data: buffer.toString('base64'),
      size: buffer.length,
    });

    // Deserialize (simulate receiving in Python)
    const deserialized = JSON.parse(serialized);
    const receivedBuffer = Buffer.from(deserialized.data, 'base64');

    const elapsed = Date.now() - start;
    times.push(elapsed);

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
    }
  }

  console.log(''); // New line after progress

  const endMemory = process.memoryUsage().heapUsed;

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  return {
    name: 'Traditional Copy (JSON Serialization)',
    iterations,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    throughput: 1000 / avgTime,
    memoryUsed: endMemory - startMemory,
  };
}

/**
 * Benchmark: Shared Memory
 */
async function benchmarkSharedMemory(iterations: number, imageSize: number): Promise<BenchmarkResult> {
  const memoryManager = MemoryManager.getInstance();
  const times: number[] = [];
  const startMemory = process.memoryUsage().heapUsed;

  console.log(`Running shared memory benchmark (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    // Create shared memory region
    const testData = generateTestImage(1920, 1080);
    const region = memoryManager.createRegion(imageSize, testData);

    // Simulate reading from shared memory (zero-copy)
    const buffer = memoryManager.readBuffer(region.id);

    // Release region
    memoryManager.releaseRegion(region.id);

    const elapsed = Date.now() - start;
    times.push(elapsed);

    if ((i + 1) % 100 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
    }
  }

  console.log(''); // New line after progress

  // Cleanup
  memoryManager.cleanup();

  const endMemory = process.memoryUsage().heapUsed;

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  return {
    name: 'Shared Memory (Zero-Copy)',
    iterations,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    throughput: 1000 / avgTime,
    memoryUsed: endMemory - startMemory,
  };
}

/**
 * Print benchmark results
 */
function printResults(results: BenchmarkResult[]): void {
  console.log('\n╔═════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Zero-Copy Benchmark Results                              ║');
  console.log('╠═════════════════════════════════════════════════════════════════════════════╣');

  for (const result of results) {
    console.log(`║ ${result.name.padEnd(76)} ║`);
    console.log('╟─────────────────────────────────────────────────────────────────────────────╢');
    console.log(`║   Iterations:      ${result.iterations.toString().padEnd(58)} ║`);
    console.log(`║   Total Time:      ${result.totalTime.toFixed(2)}ms`.padEnd(78) + '║');
    console.log(`║   Avg Time:        ${result.avgTime.toFixed(2)}ms`.padEnd(78) + '║');
    console.log(`║   Min Time:        ${result.minTime.toFixed(2)}ms`.padEnd(78) + '║');
    console.log(`║   Max Time:        ${result.maxTime.toFixed(2)}ms`.padEnd(78) + '║');
    console.log(`║   Throughput:      ${result.throughput.toFixed(2)} ops/sec`.padEnd(78) + '║');
    console.log(`║   Memory Used:     ${(result.memoryUsed / 1024 / 1024).toFixed(2)}MB`.padEnd(78) + '║');

    if (result.bufferPoolHits !== undefined) {
      console.log(`║   Pool Hits:       ${result.bufferPoolHits}`.padEnd(78) + '║');
      console.log(`║   Pool Misses:     ${result.bufferPoolMisses}`.padEnd(78) + '║');
    }

    console.log('╠═════════════════════════════════════════════════════════════════════════════╣');
  }

  // Calculate improvements
  const baseline = results.find(r => r.name.includes('Traditional'));
  const zeroCopy = results.find(r => r.name.includes('Buffer Pool'));

  if (baseline && zeroCopy) {
    const speedup = baseline.avgTime / zeroCopy.avgTime;
    const memSavings = ((baseline.memoryUsed - zeroCopy.memoryUsed) / baseline.memoryUsed) * 100;

    console.log('║                           Performance Comparison                            ║');
    console.log('╟─────────────────────────────────────────────────────────────────────────────╢');
    console.log(`║   Speed Improvement:    ${speedup.toFixed(2)}x faster`.padEnd(78) + '║');
    console.log(`║   Memory Savings:       ${memSavings.toFixed(2)}%`.padEnd(78) + '║');
    console.log('╚═════════════════════════════════════════════════════════════════════════════╝');
  } else {
    console.log('╚═════════════════════════════════════════════════════════════════════════════╝');
  }
}

/**
 * Main benchmark runner
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              Computer Vision Pipeline - Zero-Copy Benchmark                 ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════╝\n');

  const iterations = 1000;
  const imageSize = 1920 * 1080 * 3; // 1080p RGB image

  console.log(`Configuration:`);
  console.log(`  Image Size: 1920x1080 (${(imageSize / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`  Iterations: ${iterations}\n`);

  const results: BenchmarkResult[] = [];

  // Run benchmarks
  results.push(await benchmarkZeroCopy(iterations, imageSize));
  results.push(await benchmarkTraditionalCopy(iterations, imageSize));
  results.push(await benchmarkSharedMemory(iterations, imageSize));

  // Print results
  printResults(results);

  // Cleanup
  BufferPool.getInstance().cleanup();
  MemoryManager.getInstance().cleanup();
}

// Run benchmark
if (require.main === module) {
  main().catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}
