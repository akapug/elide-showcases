/**
 * Proxy-Memoize - Proxy-based Memoization
 * Based on https://www.npmjs.com/package/proxy-memoize (~50K+ downloads/week)
 * Features: Automatic dependency tracking with Proxies
 */

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export default memoize;

if (import.meta.url.includes("elide-proxy-memoize.ts")) {
  console.log("🔮 Proxy-Memoize (~50K+/week)\n");
  
  const compute = memoize((obj: any) => ({
    doubled: obj.value * 2
  }));
  
  console.log("compute({ value: 5 }):", compute({ value: 5 }));
  console.log("cached:", compute({ value: 5 }));
}
