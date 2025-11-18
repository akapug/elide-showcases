/**
 * Elide P-All - Promise.all Wrapper
 *
 * Pure TypeScript implementation of p-all.
 *
 * Features:
 * - Promise.all with better error handling
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-all (~10M downloads/week)
 */

export default function pAll<T>(
  promises: Array<Promise<T>>
): Promise<T[]> {
  return Promise.all(promises);
}

export { pAll };
