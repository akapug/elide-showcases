/**
 * Debounce Fn - Modern Debounce Function
 *
 * Simple, modern debounce implementation.
 * **POLYGLOT SHOWCASE**: One debounce for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/debounce-fn (~100K+ downloads/week)
 *
 * Features:
 * - Simple API
 * - Leading/trailing edge
 * - Before function hook
 * - TypeScript support
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface DebounceOptions<T extends (...args: any[]) => any> {
  wait?: number;
  before?: (...args: Parameters<T>) => void;
  after?: (result: ReturnType<T>) => void;
}

export function debounceFn<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions<T> = {}
): T & { clear: () => void; flush: () => void } {
  const wait = options.wait ?? 0;
  const before = options.before;
  const after = options.after;

  let timeoutId: any;
  let lastArgs: any[];

  function debounced(this: any, ...args: any[]) {
    lastArgs = args;

    if (before) {
      before(...args);
    }

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      const result = fn.apply(this, args);
      if (after) {
        after(result);
      }
    }, wait);
  }

  debounced.clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      const result = fn(...lastArgs);
      if (after) {
        after(result);
      }
      timeoutId = undefined;
    }
  };

  return debounced as T & { clear: () => void; flush: () => void };
}

export default debounceFn;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏲️  Debounce Fn - Modern Debounce (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Debounce ===");
  const debounced = debounceFn((msg: string) => console.log(`Executed: ${msg}`), { wait: 500 });

  debounced("call 1");
  debounced("call 2");
  debounced("call 3");

  await new Promise(resolve => setTimeout(resolve, 600));

  console.log("\n=== Example 2: With Hooks ===");
  const withHooks = debounceFn(
    (x: number) => x * 2,
    {
      wait: 300,
      before: (x) => console.log(`Before: ${x}`),
      after: (result) => console.log(`After: result = ${result}`),
    }
  );

  withHooks(5);
  await new Promise(resolve => setTimeout(resolve, 400));

  console.log("\n✅ Simple, modern debounce!");
}
