/**
 * Elide Callbackify - Convert Promises to Callbacks
 *
 * Pure TypeScript implementation of callbackify.
 *
 * Features:
 * - Convert promise-returning functions to callback style
 * - Node.js compatible
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: callbackify (~5M downloads/week)
 */

export default function callbackify<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: [...Parameters<T>, (err: any, result?: any) => void]) => void {
  return function (this: any, ...args: any[]): void {
    const callback = args.pop() as (err: any, result?: any) => void;

    fn.apply(this, args)
      .then((result: any) => {
        process.nextTick(callback, null, result);
      })
      .catch((error: any) => {
        process.nextTick(callback, error);
      });
  };
}

export { callbackify };
