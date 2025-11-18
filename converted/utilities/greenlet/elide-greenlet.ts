/**
 * Elide greenlet - Async Worker Functions
 * NPM Package: greenlet | Weekly Downloads: ~2,000,000 | License: Apache-2.0
 */

export default function greenlet<T extends Function>(fn: T): T {
  return (async (...args: any[]) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return fn(...args);
  }) as any as T;
}
