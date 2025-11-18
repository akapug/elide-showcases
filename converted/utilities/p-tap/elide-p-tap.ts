/**
 * Elide P-Tap - Tap Into Promise Chain
 *
 * Pure TypeScript implementation of p-tap.
 *
 * Features:
 * - Tap into promise chain without changing value
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-tap (~8M downloads/week)
 */

export default async function pTap<T>(
  promise: Promise<T>,
  handler: (value: T) => void | Promise<void>
): Promise<T> {
  const value = await promise;
  await handler(value);
  return value;
}

export { pTap };
