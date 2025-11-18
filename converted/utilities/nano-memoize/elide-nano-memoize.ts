/**
 * Nano-Memoize - Tiny Fast Memoization
 * Based on https://www.npmjs.com/package/nano-memoize (~50K+ downloads/week)
 * Features: Multi-arg, max age, max size, zero dependencies
 */

export function nanoMemoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxAge?: number; maxSize?: number } = {}
): T {
  const cache = new Map();
  const { maxAge, maxSize } = options;

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && (!maxAge || Date.now() - cached.time < maxAge)) {
      return cached.value;
    }

    const value = fn(...args);
    if (maxSize && cache.size >= maxSize) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, { value, time: Date.now() });
    return value;
  }) as T;
}

export default nanoMemoize;

if (import.meta.url.includes("elide-nano-memoize.ts")) {
  console.log("🔬 Nano-Memoize - Tiny Memoization (~50K+/week)\n");
  const add = nanoMemoize((a: number, b: number) => a + b);
  console.log("add(2,3):", add(2,3));
  console.log("add(2,3) cached:", add(2,3));
}
