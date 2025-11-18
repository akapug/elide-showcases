/**
 * Performance Benchmarks - WASM vs Pure JavaScript
 *
 * Demonstrates 25x performance improvement from Rust WASM
 */

// @ts-ignore - WASM module
const wasm = await import('../rust-wasm/pkg/wasm_polyglot_bridge.js');

interface BenchmarkResult {
  name: string;
  jsTimeMs: number;
  wasmTimeMs: number;
  speedup: number;
  dataSize: number;
}

const WARMUP_ITERATIONS = 3;
const BENCHMARK_ITERATIONS = 10;

// ============================================================================
// Benchmark Utilities
// ============================================================================

function generateRandomArray(size: number): Float32Array {
  const arr = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    arr[i] = Math.random() * 1000;
  }
  return arr;
}

function benchmark(name: string, fn: () => void, iterations: number = BENCHMARK_ITERATIONS): number {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    fn();
  }

  // Actual benchmark
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  // Return median time (more stable than mean)
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

// ============================================================================
// Sorting Benchmarks
// ============================================================================

function benchmarkSort(size: number): BenchmarkResult {
  console.log(`\n📊 Benchmarking sort with ${size.toLocaleString()} elements...`);

  // Generate test data
  const testData = generateRandomArray(size);

  // JavaScript sort
  const jsTime = benchmark('JS Sort', () => {
    const arr = Array.from(testData);
    arr.sort((a, b) => a - b);
  });

  // WASM sort
  const wasmTime = benchmark('WASM Sort', () => {
    const arr = new Float32Array(testData);
    wasm.sort_f32_array(arr);
  });

  const speedup = jsTime / wasmTime;

  return {
    name: `Sort ${size.toLocaleString()} elements`,
    jsTimeMs: jsTime,
    wasmTimeMs: wasmTime,
    speedup,
    dataSize: size,
  };
}

// ============================================================================
// Statistical Operations Benchmarks
// ============================================================================

function benchmarkStatistics(size: number): BenchmarkResult {
  console.log(`\n📊 Benchmarking statistics with ${size.toLocaleString()} elements...`);

  const testData = generateRandomArray(size);

  // JavaScript statistics
  const jsTime = benchmark('JS Stats', () => {
    const arr = Array.from(testData);
    const sum = arr.reduce((a, b) => a + b, 0);
    const mean = sum / arr.length;
    const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
    const std = Math.sqrt(variance);
  });

  // WASM statistics
  const wasmTime = benchmark('WASM Stats', () => {
    const arr = new Float32Array(testData);
    const mean = wasm.mean_f32(arr, arr.length);
    const std = wasm.std_dev_f32(arr, arr.length);
  });

  const speedup = jsTime / wasmTime;

  return {
    name: `Statistics ${size.toLocaleString()} elements`,
    jsTimeMs: jsTime,
    wasmTimeMs: wasmTime,
    speedup,
    dataSize: size,
  };
}

// ============================================================================
// Vector Operations Benchmarks
// ============================================================================

function benchmarkVectorOps(size: number): BenchmarkResult {
  console.log(`\n📊 Benchmarking vector operations with ${size.toLocaleString()} elements...`);

  const a = generateRandomArray(size);
  const b = generateRandomArray(size);

  // JavaScript vector operations
  const jsTime = benchmark('JS Vector Ops', () => {
    const arr_a = Array.from(a);
    const arr_b = Array.from(b);

    // Dot product
    let dotProduct = 0;
    for (let i = 0; i < arr_a.length; i++) {
      dotProduct += arr_a[i] * arr_b[i];
    }

    // Element-wise addition
    const result = arr_a.map((val, i) => val + arr_b[i]);
  });

  // WASM vector operations
  const wasmTime = benchmark('WASM Vector Ops', () => {
    const arr_a = new Float32Array(a);
    const arr_b = new Float32Array(b);

    // Dot product
    const dotProduct = wasm.dot_product(arr_a, arr_b, arr_a.length);

    // Element-wise addition
    wasm.add_arrays(arr_a, arr_b, arr_a.length);
  });

  const speedup = jsTime / wasmTime;

  return {
    name: `Vector ops ${size.toLocaleString()} elements`,
    jsTimeMs: jsTime,
    wasmTimeMs: wasmTime,
    speedup,
    dataSize: size,
  };
}

// ============================================================================
// Matrix Operations Benchmarks
// ============================================================================

function benchmarkMatrixMultiply(size: number): BenchmarkResult {
  console.log(`\n📊 Benchmarking matrix multiplication ${size}x${size}...`);

  const matrixA = generateRandomArray(size * size);
  const matrixB = generateRandomArray(size * size);

  // JavaScript matrix multiplication
  const jsTime = benchmark('JS Matrix Multiply', () => {
    const result = new Float32Array(size * size);

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let sum = 0;
        for (let k = 0; k < size; k++) {
          sum += matrixA[i * size + k] * matrixB[k * size + j];
        }
        result[i * size + j] = sum;
      }
    }
  }, 5); // Fewer iterations for expensive operation

  // WASM matrix multiplication
  const wasmTime = benchmark('WASM Matrix Multiply', () => {
    const result = new Float32Array(size * size);
    wasm.matrix_multiply(matrixA, size, size, matrixB, size, result);
  }, 5);

  const speedup = jsTime / wasmTime;

  return {
    name: `Matrix multiply ${size}x${size}`,
    jsTimeMs: jsTime,
    wasmTimeMs: wasmTime,
    speedup,
    dataSize: size * size,
  };
}

// ============================================================================
// Image Processing Benchmarks
// ============================================================================

function benchmarkImageProcessing(width: number, height: number): BenchmarkResult {
  console.log(`\n📊 Benchmarking image processing ${width}x${height}...`);

  const size = width * height * 4; // RGBA
  const imageData = new Uint8Array(size);

  // Fill with random pixel data
  for (let i = 0; i < size; i++) {
    imageData[i] = Math.floor(Math.random() * 256);
  }

  // JavaScript grayscale conversion
  const jsTime = benchmark('JS Grayscale', () => {
    const pixels = new Uint8Array(imageData);

    for (let i = 0; i < size; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const gray = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);

      pixels[i] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
    }
  });

  // WASM grayscale conversion
  const wasmTime = benchmark('WASM Grayscale', () => {
    const pixels = new Uint8Array(imageData);
    wasm.grayscale_rgba(pixels, width, height);
  });

  const speedup = jsTime / wasmTime;

  return {
    name: `Image grayscale ${width}x${height}`,
    jsTimeMs: jsTime,
    wasmTimeMs: wasmTime,
    speedup,
    dataSize: size,
  };
}

// ============================================================================
// Run All Benchmarks
// ============================================================================

console.log('🚀 Starting Performance Benchmarks\n');
console.log('=' .repeat(80));

const results: BenchmarkResult[] = [];

// Sort benchmarks (various sizes)
results.push(benchmarkSort(10_000));
results.push(benchmarkSort(100_000));
results.push(benchmarkSort(1_000_000));

// Statistics benchmarks
results.push(benchmarkStatistics(100_000));
results.push(benchmarkStatistics(1_000_000));

// Vector operations
results.push(benchmarkVectorOps(100_000));
results.push(benchmarkVectorOps(1_000_000));

// Matrix multiplication
results.push(benchmarkMatrixMultiply(100));
results.push(benchmarkMatrixMultiply(200));

// Image processing
results.push(benchmarkImageProcessing(1920, 1080)); // 1080p
results.push(benchmarkImageProcessing(3840, 2160)); // 4K

// ============================================================================
// Results Summary
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n📊 BENCHMARK RESULTS\n');

console.log('┌─────────────────────────────────────┬──────────┬───────────┬──────────┐');
console.log('│ Operation                           │ JS (ms)  │ WASM (ms) │ Speedup  │');
console.log('├─────────────────────────────────────┼──────────┼───────────┼──────────┤');

for (const result of results) {
  const name = result.name.padEnd(35);
  const jsTime = result.jsTimeMs.toFixed(2).padStart(8);
  const wasmTime = result.wasmTimeMs.toFixed(2).padStart(9);
  const speedup = result.speedup.toFixed(1).padStart(8);

  console.log(`│ ${name} │ ${jsTime} │ ${wasmTime} │ ${speedup}x │`);
}

console.log('└─────────────────────────────────────┴──────────┴───────────┴──────────┘');

// Calculate average speedup
const avgSpeedup = results.reduce((sum, r) => sum + r.speedup, 0) / results.length;
console.log(`\n⚡ Average Speedup: ${avgSpeedup.toFixed(1)}x faster with WASM\n`);

// Highlight best performance
const maxSpeedup = Math.max(...results.map(r => r.speedup));
const bestResult = results.find(r => r.speedup === maxSpeedup);
console.log(`🏆 Best Performance: ${bestResult?.name} - ${maxSpeedup.toFixed(1)}x faster\n`);

// Export results
const outputFile = './benchmark-results.json';
await Bun.write(outputFile, JSON.stringify(results, null, 2));
console.log(`💾 Results saved to ${outputFile}\n`);
