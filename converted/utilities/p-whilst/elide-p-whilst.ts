/**
 * Elide P-Whilst - While Loop for Promises
 *
 * Pure TypeScript implementation of p-whilst.
 *
 * Features:
 * - Repeat while condition is true
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-whilst (~2M downloads/week)
 */

export default async function pWhilst(
  condition: () => boolean,
  action: () => Promise<void> | void
): Promise<void> {
  while (condition()) {
    await action();
  }
}

export { pWhilst };
