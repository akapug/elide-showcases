/**
 * P-Memoize - Promise Memoization
 * Based on https://www.npmjs.com/package/p-memoize (~300K+ downloads/week)
 * Features: Async function memoization, cache expiry
 */

export function pMemoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { maxAge?: number; cacheKey?: (...args: any[]) => string } = {}
): T {
  const cache = new Map();
  const { maxAge, cacheKey = (...args: any[]) => JSON.stringify(args) } = options;

  return (async (...args: any[]) => {
    const key = cacheKey(...args);
    
    if (cache.has(key)) {
      const entry = cache.get(key);
      if (!maxAge || Date.now() - entry.timestamp < maxAge) {
        return entry.value;
      }
      cache.delete(key);
    }

    const promise = fn(...args);
    const value = await promise;
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  }) as T;
}

export default pMemoize;

if (import.meta.url.includes("elide-p-memoize.ts")) {
  console.log("⚡ P-Memoize - Promise Memoization (~300K+/week)\n");
  
  let calls = 0;
  const fetchUser = pMemoize(async (id: number) => {
    calls++;
    return { id, name: \`User\${id}\` };
  });

  (async () => {
    console.log("First call:", await fetchUser(1));
    console.log("Cached:", await fetchUser(1));
    console.log("Total API calls:", calls);
  })();
}
