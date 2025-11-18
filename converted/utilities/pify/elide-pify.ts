/**
 * Elide Pify - Promisify Callback Functions
 *
 * Pure TypeScript implementation of pify.
 *
 * Features:
 * - Promisify callback-based functions
 * - Support for multiple arguments
 * - Custom error handling
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: pify (~40M downloads/week)
 */

export interface PifyOptions {
  multiArgs?: boolean;
  errorFirst?: boolean;
}

export default function pify<T extends (...args: any[]) => void>(
  fn: T,
  options: PifyOptions = {}
): (...args: any[]) => Promise<any> {
  const { multiArgs = false, errorFirst = true } = options;

  return function (this: any, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const callback = (err: any, ...results: any[]) => {
        if (errorFirst && err) {
          reject(err);
        } else {
          if (multiArgs) {
            resolve(errorFirst ? results : [err, ...results]);
          } else {
            resolve(errorFirst ? results[0] : err);
          }
        }
      };

      fn.apply(this, [...args, callback]);
    });
  };
}

export { pify };
