/**
 * Elide P-Waterfall - Waterfall Execution
 *
 * Pure TypeScript implementation of p-waterfall.
 *
 * Features:
 * - Run tasks where each consumes previous result
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-waterfall (~2M downloads/week)
 */

export default async function pWaterfall<T>(
  tasks: Array<(arg?: any) => Promise<T> | T>,
  initialValue?: any
): Promise<T> {
  let result = initialValue;
  for (const task of tasks) {
    result = await task(result);
  }
  return result;
}

export { pWaterfall };
