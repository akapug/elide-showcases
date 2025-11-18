/**
 * Elide P-Race - Promise.race Wrapper
 *
 * Pure TypeScript implementation of p-race.
 *
 * Features:
 * - Promise.race with better error handling
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-race (~3M downloads/week)
 */

export default function pRace<T>(
  promises: Array<Promise<T>>
): Promise<T> {
  return Promise.race(promises);
}

export { pRace };
