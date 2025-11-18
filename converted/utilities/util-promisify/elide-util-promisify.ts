/**
 * Elide Util.Promisify - Node.js Promisify Utility
 *
 * Pure TypeScript implementation of util.promisify.
 *
 * Features:
 * - Promisify Node.js callback functions
 * - Compatible with Node.js util.promisify
 * - Custom promisify symbol support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: util.promisify (~50M downloads/week)
 */

export const promisify = {
  custom: Symbol('util.promisify.custom'),
};

export default function utilPromisify<T extends (...args: any[]) => void>(
  fn: T & { [promisify.custom]?: (...args: any[]) => Promise<any> }
): (...args: any[]) => Promise<any> {
  if (fn[promisify.custom]) {
    return fn[promisify.custom];
  }

  return function (this: any, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const callback = (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      };

      fn.apply(this, [...args, callback]);
    });
  };
}

export { utilPromisify };
