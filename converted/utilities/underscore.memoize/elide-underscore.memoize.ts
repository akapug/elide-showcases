/**
 * Underscore.Memoize - Underscore Memoization
 * Based on Underscore.js memoize (~100K+ downloads/week)
 * Features: Hash function customization
 */

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  hasher?: (...args: any[]) => string
): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = hasher ? hasher(...args) : JSON.stringify(args[0]);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export default memoize;

if (import.meta.url.includes("elide-underscore.memoize.ts")) {
  console.log("🔶 Underscore.Memoize (~100K+/week)\n");
  
  const fibonacci = memoize((n: number): number => {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  });
  
  console.log("fibonacci(10):", fibonacci(10));
}
