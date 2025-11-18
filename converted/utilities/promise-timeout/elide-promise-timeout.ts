/**
 * Promise Timeout - Add Timeouts to Promises
 *
 * Wrap promises with automatic timeouts.
 * **POLYGLOT SHOWCASE**: One promise timeout for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/promise-timeout (~100K+ downloads/week)
 *
 * Features:
 * - Promise timeout wrapper
 * - Custom timeout errors
 * - Rejection or timeout value
 * - TypeScript support
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class TimeoutError extends Error {
  constructor(message: string = "Promise timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(message));
    }, ms);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export function timeoutWithValue<T, V>(
  promise: Promise<T>,
  ms: number,
  value: V
): Promise<T | V> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(value);
    }, ms);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export default { timeout, timeoutWithValue, TimeoutError };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  Promise Timeout - Add Timeouts to Promises (POLYGLOT!)\n");

  console.log("=== Example 1: Timeout with Error ===");
  const slowPromise = new Promise(resolve => setTimeout(() => resolve("done"), 2000));

  try {
    await timeout(slowPromise, 1000, "Operation timed out");
  } catch (err) {
    console.log("Caught:", (err as Error).message);
  }

  console.log("\n=== Example 2: Timeout with Value ===");
  const result = await timeoutWithValue(slowPromise, 500, "default");
  console.log("Result:", result);

  console.log("\n✅ Promise timeout utilities!");
}
