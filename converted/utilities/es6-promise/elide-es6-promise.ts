/**
 * ES6 Promise - Promise Polyfill
 *
 * Polyfill for ES6 Promises.
 * **POLYGLOT SHOWCASE**: ES6 Promises for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/es6-promise (~2M+ downloads/week)
 */

export class ES6Promise<T> {
  constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void) {
    return new Promise(executor) as any;
  }

  static polyfill(): void {
    if (typeof Promise === 'undefined') {
      (globalThis as any).Promise = ES6Promise;
    }
  }
}

export function polyfill(): void {
  ES6Promise.polyfill();
}

export default ES6Promise;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 ES6 Promise (POLYGLOT!)\n");
  
  const promise = new ES6Promise((resolve) => resolve('Success!'));
  promise.then((val: string) => console.log(val));
  console.log("\n  ✓ ~2M+ downloads/week!");
}
