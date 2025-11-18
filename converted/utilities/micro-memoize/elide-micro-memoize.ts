/**
 * Micro-Memoize - Micro-sized Memoization
 * Based on https://www.npmjs.com/package/micro-memoize (~100K+ downloads/week)
 * Features: Tiny, fast, customizable cache key
 */

export function microMemoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number } = {}
): T {
  const cache = new Map();
  const { maxSize = Infinity } = options;

  return ((...args: any[]) => {
    const key = args.length === 1 ? args[0] : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    const result = fn(...args);
    if (cache.size >= maxSize) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, result);
    return result;
  }) as T;
}

export default microMemoize;

if (import.meta.url.includes("elide-micro-memoize.ts")) {
  console.log("🦠 Micro-Memoize - Micro-sized Memoization (~100K+/week)\n");
  const square = microMemoize((n: number) => n * n);
  console.log("square(5):", square(5));
  console.log("square(5) cached:", square(5));
}
