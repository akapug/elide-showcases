/**
 * Elide P-Settle - Settle All Promises
 *
 * Pure TypeScript implementation of p-settle (similar to Promise.allSettled).
 *
 * Features:
 * - Settle all promises regardless of rejection
 * - Inspection of each result
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-settle (~8M downloads/week)
 */

export interface SettledResult<T> {
  isFulfilled: boolean;
  isRejected: boolean;
  value?: T;
  reason?: any;
}

export default async function pSettle<T>(
  promises: Array<Promise<T>>
): Promise<Array<SettledResult<T>>> {
  const results = await Promise.allSettled(promises);

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return {
        isFulfilled: true,
        isRejected: false,
        value: result.value,
      };
    } else {
      return {
        isFulfilled: false,
        isRejected: true,
        reason: result.reason,
      };
    }
  });
}

export { pSettle };
