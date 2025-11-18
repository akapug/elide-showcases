/**
 * Elide P-Some - Get Some Resolved Promises
 *
 * Pure TypeScript implementation of p-some.
 *
 * Features:
 * - Get first N resolved promises
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-some (~3M downloads/week)
 */

export default async function pSome<T>(
  promises: Array<Promise<T>>,
  count: number
): Promise<T[]> {
  const results: T[] = [];
  let completed = 0;

  return new Promise((resolve, reject) => {
    promises.forEach(promise => {
      promise
        .then(value => {
          results.push(value);
          completed++;
          if (results.length >= count) {
            resolve(results.slice(0, count));
          } else if (completed === promises.length && results.length < count) {
            reject(new Error(`Only ${results.length} promises resolved`));
          }
        })
        .catch(() => {
          completed++;
          if (completed === promises.length && results.length < count) {
            reject(new Error(`Only ${results.length} promises resolved`));
          }
        });
    });
  });
}

export { pSome };
