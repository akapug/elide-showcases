/**
 * Elide P-Each-Series - Serial Promise Iteration
 *
 * Pure TypeScript implementation of p-each-series.
 *
 * Features:
 * - Iterate over array items serially
 * - Async/await support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-each-series (~8M downloads/week)
 */

export default async function pEachSeries<T>(
  input: Iterable<T>,
  iterator: (item: T, index: number) => Promise<void> | void
): Promise<void> {
  let index = 0;
  for (const item of input) {
    await iterator(item, index++);
  }
}

export { pEachSeries };
