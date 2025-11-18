/**
 * Debounce Promise - Promise Debouncing
 *
 * Debounce promise-returning functions.
 * **POLYGLOT SHOWCASE**: One promise debounce for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/debounce-promise (~100K+ downloads/week)
 *
 * Features:
 * - Promise-aware debouncing
 * - Shared promise results
 * - Accumulate mode
 * - Leading edge option
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface DebouncePromiseOptions {
  leading?: boolean;
  accumulate?: boolean;
}

export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: DebouncePromiseOptions = {}
): T {
  const { leading = false, accumulate = false } = options;

  let timeoutId: any;
  let pendingPromise: Promise<any> | null = null;
  let pendingArgs: any[] = [];

  function debounced(this: any, ...args: any[]): Promise<any> {
    if (pendingPromise && !accumulate) {
      return pendingPromise;
    }

    if (accumulate) {
      pendingArgs.push(args);
    }

    clearTimeout(timeoutId);

    if (leading && !pendingPromise) {
      pendingPromise = fn.apply(this, args);
      return pendingPromise.finally(() => {
        pendingPromise = null;
      });
    }

    pendingPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        const execArgs = accumulate ? pendingArgs : args;
        pendingArgs = [];

        fn.apply(this, execArgs)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            pendingPromise = null;
          });
      }, wait);
    });

    return pendingPromise;
  }

  return debounced as T;
}

export default debouncePromise;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Debounce Promise - Promise Debouncing (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Promise Debounce ===");
  const fetchData = debouncePromise(
    async (query: string) => {
      console.log(`Fetching: ${query}`);
      return { results: [query] };
    },
    300
  );

  fetchData("hello");
  fetchData("world");
  const result = await fetchData("elide");
  console.log("Result:", result);

  console.log("\n✅ Promise-aware debouncing!");
}
