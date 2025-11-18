/**
 * Fast-Memoize - Fastest Memoization
 *
 * The fastest possible memoization library in pure JavaScript.
 * **POLYGLOT SHOWCASE**: Blazing fast memoization for ALL languages!
 *
 * Based on https://www.npmjs.com/package/fast-memoize (~300K+ downloads/week)
 *
 * Features:
 * - Extremely fast (optimized for V8)
 * - Single cache or multi-argument
 * - Custom serializer support
 * - Zero dependencies
 */

export interface FastMemoizeOptions {
  serializer?: (...args: any[]) => string;
  cache?: Map<any, any>;
}

export function fastMemoize<T extends (...args: any[]) => any>(
  fn: T,
  options: FastMemoizeOptions = {}
): T {
  const cache = options.cache || new Map();
  const serializer = options.serializer || ((args: any[]) => JSON.stringify(args));

  return ((...args: any[]) => {
    const key = args.length === 1 ? args[0] : serializer(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export default fastMemoize;

if (import.meta.url.includes("elide-fast-memoize.ts")) {
  console.log("🏃 Fast-Memoize - Fastest Memoization\n");
  
  const fibonacci = fastMemoize((n: number): number => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  });
  
  console.log("fibonacci(40):", fibonacci(40));
  console.log("fibonacci(40) cached:", fibonacci(40));
  
  console.log("\n⚡ Optimized for maximum performance!");
  console.log("~300K+ downloads/week on npm!");
}
