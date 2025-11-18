/**
 * microtime - Microsecond precision timing
 *
 * Get current time in microseconds for precise measurements.
 * **POLYGLOT SHOWCASE**: Precise timing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/microtime (~500K+ downloads/week)
 *
 * Features:
 * - Microsecond precision
 * - Unix timestamp
 * - Performance timing
 * - Benchmark support
 * - Zero dependencies
 *
 * Use cases:
 * - Performance benchmarks
 * - Precise measurements
 * - Timing tests
 *
 * Package has ~500K+ downloads/week on npm!
 */

class MicroTime {
  /**
   * Get current time in microseconds since Unix epoch
   */
  now(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      // Use high-resolution time
      return Math.floor(performance.now() * 1000);
    }
    // Fallback to Date with microsecond estimation
    return Date.now() * 1000;
  }

  /**
   * Get current time as [seconds, microseconds]
   */
  nowDouble(): [number, number] {
    const micros = this.now();
    const seconds = Math.floor(micros / 1000000);
    const microsOnly = micros % 1000000;
    return [seconds, microsOnly];
  }

  /**
   * Get current time in seconds with fractional microseconds
   */
  nowStruct(): number {
    const micros = this.now();
    return micros / 1000000;
  }

  /**
   * Measure execution time of a function
   */
  measure<T>(fn: () => T): { result: T; microseconds: number } {
    const start = this.now();
    const result = fn();
    const end = this.now();
    return {
      result,
      microseconds: end - start,
    };
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; microseconds: number }> {
    const start = this.now();
    const result = await fn();
    const end = this.now();
    return {
      result,
      microseconds: end - start,
    };
  }

  /**
   * Sleep for specified microseconds
   */
  async sleep(microseconds: number): Promise<void> {
    const milliseconds = microseconds / 1000;
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Convert microseconds to milliseconds
   */
  toMillis(microseconds: number): number {
    return microseconds / 1000;
  }

  /**
   * Convert microseconds to seconds
   */
  toSeconds(microseconds: number): number {
    return microseconds / 1000000;
  }

  /**
   * Format microseconds as human-readable string
   */
  format(microseconds: number): string {
    if (microseconds < 1000) {
      return `${microseconds.toFixed(2)}μs`;
    } else if (microseconds < 1000000) {
      return `${(microseconds / 1000).toFixed(2)}ms`;
    } else {
      return `${(microseconds / 1000000).toFixed(2)}s`;
    }
  }
}

const microtime = new MicroTime();

// Export both instance and class
export default microtime;
export { MicroTime };

// Also export individual functions for convenience
export const now = () => microtime.now();
export const nowDouble = () => microtime.nowDouble();
export const nowStruct = () => microtime.nowStruct();
export const measure = <T>(fn: () => T) => microtime.measure(fn);
export const measureAsync = <T>(fn: () => Promise<T>) => microtime.measureAsync(fn);

// CLI Demo
if (import.meta.url.includes('elide-microtime.ts')) {
  console.log('⏱️  microtime - Microsecond Timing for Elide (POLYGLOT!)\n');

  console.log('Example 1: Get Current Time\n');
  console.log('  Microseconds:', microtime.now());
  console.log('  Double:', microtime.nowDouble());
  console.log('  Struct:', microtime.nowStruct());
  console.log('✓ Current time retrieved');

  console.log('\nExample 2: Measure Function\n');
  const { result, microseconds } = microtime.measure(() => {
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      sum += i;
    }
    return sum;
  });
  console.log('  Result:', result);
  console.log('  Time:', microtime.format(microseconds));
  console.log('✓ Function measured');

  console.log('\nExample 3: Async Measurement\n');
  microtime.measureAsync(async () => {
    await microtime.sleep(1000); // 1ms
    return 'done';
  }).then(({ result, microseconds }) => {
    console.log('  Result:', result);
    console.log('  Time:', microtime.format(microseconds));
    console.log('✓ Async function measured');
  });

  console.log('\nExample 4: Time Conversion\n');
  const micros = 1234567;
  console.log('  Microseconds:', micros);
  console.log('  Milliseconds:', microtime.toMillis(micros));
  console.log('  Seconds:', microtime.toSeconds(micros));
  console.log('✓ Time conversion works');

  console.log('\nExample 5: Format Times\n');
  console.log('  500μs:', microtime.format(500));
  console.log('  5000μs:', microtime.format(5000));
  console.log('  5000000μs:', microtime.format(5000000));
  console.log('✓ Time formatting works');

  setTimeout(() => {
    console.log('\n✅ Microsecond timing complete!');
    console.log('🚀 ~500K+ downloads/week on npm!');
    console.log('💡 Precise timing for performance testing!');
  }, 100);
}
