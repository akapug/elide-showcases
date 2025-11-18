/**
 * Elide Sleep-Promise - Sleep Utility
 *
 * Pure TypeScript implementation of sleep-promise.
 *
 * Features:
 * - Sleep/delay execution
 * - Simple API
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: sleep-promise (~1M downloads/week)
 */

export default function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { sleep };
