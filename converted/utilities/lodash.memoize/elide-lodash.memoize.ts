/**
 * Lodash.Memoize - Lodash Memoization
 * Based on https://www.npmjs.com/package/lodash.memoize (~500K+ downloads/week)
 * Features: Resolver function, cache manipulation
 */

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: any[]) => any
): T & { cache: Map<any, any> } {
  const cache = new Map();

  const memoized = ((...args: any[]) => {
    const key = resolver ? resolver(...args) : args[0];
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<any, any> };

  memoized.cache = cache;
  return memoized;
}

export default memoize;

if (import.meta.url.includes("elide-lodash.memoize.ts")) {
  console.log("🔷 Lodash.Memoize (~500K+/week)\n");
  
  const object = memoize((obj: any) => obj.value, (obj) => obj.id);
  console.log("memoize({ id: 1, value: 'a' }):", object({ id: 1, value: 'a' }));
  console.log("cached:", object({ id: 1, value: 'b' }));
}
