/**
 * Elide P-Catch-If - Conditional Promise Catch
 *
 * Pure TypeScript implementation of p-catch-if.
 *
 * Features:
 * - Conditional error catching
 * - Type-based filtering
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-catch-if (~2M downloads/week)
 */

export default async function pCatchIf<T>(
  promise: Promise<T>,
  predicate: (error: any) => boolean,
  handler: (error: any) => T | Promise<T>
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (predicate(error)) {
      return await handler(error);
    }
    throw error;
  }
}

export { pCatchIf };
