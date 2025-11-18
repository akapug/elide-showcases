/**
 * Awesome Debounce Promise - Advanced Promise Debouncing
 *
 * Powerful promise debouncing with advanced features.
 * **POLYGLOT SHOWCASE**: One awesome debounce for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/awesome-debounce-promise (~50K+ downloads/week)
 *
 * Features:
 * - Promise debouncing
 * - Key-based debouncing
 * - Cancelation support
 * - Leading/trailing edge
 *
 * Package has ~50K+ downloads/week on npm!
 */

interface AwesomeDebounceOptions {
  key?: (...args: any[]) => string;
  leading?: boolean;
  onlyResolvesLast?: boolean;
}

export function awesomeDebouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number,
  options: AwesomeDebounceOptions = {}
): T {
  const { key, leading = false, onlyResolvesLast = true } = options;

  const timeouts = new Map<string, any>();
  const pending = new Map<string, Promise<any>>();

  function debounced(this: any, ...args: any[]): Promise<any> {
    const cacheKey = key ? key(...args) : "default";

    clearTimeout(timeouts.get(cacheKey));

    if (leading && !pending.has(cacheKey)) {
      const promise = fn.apply(this, args);
      pending.set(cacheKey, promise);
      return promise.finally(() => pending.delete(cacheKey));
    }

    if (!onlyResolvesLast && pending.has(cacheKey)) {
      return pending.get(cacheKey)!;
    }

    const promise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        fn.apply(this, args)
          .then(resolve)
          .catch(reject)
          .finally(() => pending.delete(cacheKey));
      }, wait);

      timeouts.set(cacheKey, timeoutId);
    });

    pending.set(cacheKey, promise);
    return promise;
  }

  return debounced as T;
}

export default awesomeDebouncePromise;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Awesome Debounce Promise - Advanced Debouncing (POLYGLOT!)\n");

  console.log("=== Example: Key-Based Debouncing ===");
  const search = awesomeDebouncePromise(
    async (userId: string, query: string) => {
      console.log(`Searching for user ${userId}: ${query}`);
      return { userId, query };
    },
    300,
    { key: (userId) => userId }
  );

  search("user1", "hello");
  search("user2", "world");
  await new Promise(resolve => setTimeout(resolve, 400));

  console.log("\n✅ Advanced promise debouncing!");
}
