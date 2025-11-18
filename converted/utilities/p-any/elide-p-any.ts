/**
 * Elide P-Any - First Resolved Promise
 *
 * Pure TypeScript implementation of p-any.
 *
 * Features:
 * - Get first resolved promise
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-any (~5M downloads/week)
 */

export default function pAny<T>(
  promises: Array<Promise<T>>
): Promise<T> {
  return Promise.any(promises);
}

export { pAny };
