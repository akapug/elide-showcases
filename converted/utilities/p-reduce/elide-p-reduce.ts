/**
 * Elide P-Reduce - Promise Reduce
 *
 * Pure TypeScript implementation of p-reduce for reducing promises.
 *
 * Features:
 * - Reduce an array using async functions
 * - Serial execution
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-reduce (~8M downloads/week)
 */

export default async function pReduce<T, R>(
  input: Iterable<T>,
  reducer: (accumulator: R, item: T, index: number) => Promise<R> | R,
  initialValue: R
): Promise<R> {
  let accumulator = initialValue;
  let index = 0;

  for (const item of input) {
    accumulator = await reducer(accumulator, item, index++);
  }

  return accumulator;
}

export { pReduce };
