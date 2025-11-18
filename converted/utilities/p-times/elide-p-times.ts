/**
 * Elide P-Times - Run Function N Times
 *
 * Pure TypeScript implementation of p-times.
 *
 * Features:
 * - Run function N times
 * - Concurrency support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-times (~5M downloads/week)
 */

export default async function pTimes<T>(
  count: number,
  mapper: (index: number) => Promise<T> | T,
  options: { concurrency?: number } = {}
): Promise<T[]> {
  const { concurrency = Infinity } = options;
  const indices = Array.from({ length: count }, (_, i) => i);

  if (concurrency === Infinity) {
    return Promise.all(indices.map(mapper));
  }

  const results: T[] = new Array(count);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < count; i++) {
    const promise = Promise.resolve(mapper(i)).then(result => {
      results[i] = result;
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

export { pTimes };
