/**
 * Elide P-Series - Run Promise-Returning Functions in Series
 *
 * Pure TypeScript implementation of p-series.
 *
 * Features:
 * - Run promise-returning functions serially
 * - Collect all results
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-series (~5M downloads/week)
 */

export default async function pSeries<T>(
  tasks: Array<() => Promise<T> | T>
): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

export { pSeries };
