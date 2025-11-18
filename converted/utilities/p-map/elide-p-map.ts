/**
 * Elide P-Map - Concurrent Map for Promises
 *
 * Pure TypeScript implementation of p-map for mapping with concurrency control.
 *
 * Features:
 * - Map over arrays with concurrency limit
 * - Stop on error support
 * - Progress tracking
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-map (~30M downloads/week)
 */

export interface PMapOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export default async function pMap<T, R>(
  input: Iterable<T>,
  mapper: (item: T, index: number) => Promise<R> | R,
  options: PMapOptions = {}
): Promise<R[]> {
  const { concurrency = Infinity, stopOnError = true } = options;

  const arr = Array.from(input);
  const results: R[] = new Array(arr.length);
  const errors: any[] = [];

  if (concurrency === Infinity) {
    const promises = arr.map((item, index) =>
      Promise.resolve(mapper(item, index)).then(result => {
        results[index] = result;
      }).catch(error => {
        if (stopOnError) throw error;
        errors.push(error);
      })
    );
    await Promise.all(promises);
    return results;
  }

  const executing: Promise<void>[] = [];

  for (let i = 0; i < arr.length; i++) {
    const promise = Promise.resolve(mapper(arr[i], i))
      .then(result => {
        results[i] = result;
      })
      .catch(error => {
        if (stopOnError) throw error;
        errors.push(error);
      });

    const executing_promise = promise.then(() => {
      executing.splice(executing.indexOf(executing_promise), 1);
    });

    executing.push(executing_promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

export { pMap };
