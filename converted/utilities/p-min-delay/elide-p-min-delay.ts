/**
 * p-min-delay - Minimum Delay for Promises
 *
 * Ensure promises take at least a minimum time.
 * **POLYGLOT SHOWCASE**: One min delay for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/p-min-delay (~100K+ downloads/week)
 *
 * Features:
 * - Minimum execution time
 * - Loading state control
 * - UX improvements
 * - Promise wrapping
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function pMinDelay<T>(
  promise: Promise<T>,
  minimumDelay: number
): Promise<T> {
  const start = Date.now();

  return Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, minimumDelay))
  ]).then(([result]) => {
    const elapsed = Date.now() - start;
    if (elapsed < minimumDelay) {
      return new Promise<T>(resolve =>
        setTimeout(() => resolve(result), minimumDelay - elapsed)
      );
    }
    return result;
  });
}

export default pMinDelay;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  p-min-delay - Minimum Promise Delay (POLYGLOT!)\n");

  console.log("=== Example: Ensure Minimum Loading Time ===");

  async function fastOperation(): Promise<string> {
    return "Done!";
  }

  console.log("Without min delay:");
  const start1 = Date.now();
  await fastOperation();
  console.log(`Took ${Date.now() - start1}ms`);

  console.log("\nWith 1000ms min delay:");
  const start2 = Date.now();
  await pMinDelay(fastOperation(), 1000);
  console.log(`Took ${Date.now() - start2}ms`);

  console.log("\n✅ Prevent flickering loading states!");
}
