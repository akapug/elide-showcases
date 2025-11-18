/**
 * Elide P-Forever - Forever Loop for Promises
 *
 * Pure TypeScript implementation of p-forever.
 *
 * Features:
 * - Run function forever until error
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-forever (~1M downloads/week)
 */

export default async function pForever(
  action: () => Promise<void> | void
): Promise<never> {
  while (true) {
    await action();
  }
}

export { pForever };
