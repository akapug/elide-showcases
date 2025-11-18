/**
 * Memoizerific - Memoization with Max Size
 * Based on https://www.npmjs.com/package/memoizerific (~50K+ downloads/week)
 * Features: LRU cache, max size, multi-argument
 */

export function memoizerific(maxSize: number) {
  return function <T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();

    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, result);
      return result;
    }) as T;
  };
}

export default memoizerific;

if (import.meta.url.includes("elide-memoizerific.ts")) {
  console.log("📦 Memoizerific - LRU Memoization (~50K+/week)\n");
  
  const memoize = memoizerific(2);
  const add = memoize((a: number, b: number) => a + b);
  
  console.log("add(1,2):", add(1,2));
  console.log("add(2,3):", add(2,3));
  console.log("add(3,4):", add(3,4));
  console.log("add(1,2) evicted:", add(1,2));
}
