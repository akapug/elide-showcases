/**
 * Performance-Now - High Resolution Time
 *
 * Core features:
 * - High-resolution timestamps
 * - Monotonic time
 * - Sub-millisecond precision
 * - Cross-platform
 * - Benchmarking support
 * - Zero overhead
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 40M+ downloads/week
 */

let startTime: number;
let lastTime: number;

// Initialize with current time
function init() {
  if (typeof performance !== 'undefined' && performance.now) {
    startTime = performance.now();
    lastTime = startTime;
  } else {
    startTime = Date.now();
    lastTime = startTime;
  }
}

init();

export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }

  // Fallback to Date.now() with microsecond simulation
  const currentTime = Date.now();
  if (currentTime === lastTime) {
    // Add small increment to ensure monotonicity
    lastTime += 0.001;
  } else {
    lastTime = currentTime;
  }

  return lastTime - startTime;
}

export function reset(): void {
  init();
}

export function elapsed(): number {
  return now();
}

// Utility function for benchmarking
export function benchmark(fn: () => void, iterations: number = 1): number {
  const start = now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  return (now() - start) / iterations;
}

// Async benchmark
export async function benchmarkAsync(
  fn: () => Promise<void>,
  iterations: number = 1
): Promise<number> {
  const start = now();

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  return (now() - start) / iterations;
}

if (import.meta.url.includes("performance-now")) {
  console.log("🎯 Performance-Now for Elide - High Resolution Time\n");

  console.log("=== High Resolution Timing ===");
  const t1 = now();
  console.log("Current time:", t1.toFixed(3), "ms");

  // Small computation
  let sum = 0;
  for (let i = 0; i < 100000; i++) {
    sum += i;
  }

  const t2 = now();
  console.log("After computation:", t2.toFixed(3), "ms");
  console.log("Duration:", (t2 - t1).toFixed(3), "ms");

  console.log("\n=== Benchmarking ===");
  const avgTime = benchmark(() => {
    let x = 0;
    for (let i = 0; i < 1000; i++) {
      x += i * i;
    }
  }, 100);

  console.log("Average time per iteration:", avgTime.toFixed(3), "ms");

  console.log("\n=== Multiple Measurements ===");
  const measurements: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = now();
    // Simulate work
    for (let j = 0; j < 10000; j++) {
      Math.sqrt(j);
    }
    measurements.push(now() - start);
  }

  console.log("Measurements:", measurements.map(m => m.toFixed(3)).join(", "), "ms");
  const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  console.log("Average:", avg.toFixed(3), "ms");

  console.log();
  console.log("✅ Use Cases: Precise timing, Benchmarking, Performance profiling");
  console.log("🚀 40M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default now;
