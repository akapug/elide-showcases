/**
 * Elide P-Reflect - Promise Reflection
 *
 * Pure TypeScript implementation of p-reflect.
 *
 * Features:
 * - Reflect promise state
 * - Inspection without throwing
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-reflect (~8M downloads/week)
 */

export interface ReflectedPromise<T> {
  isFulfilled: boolean;
  isRejected: boolean;
  value?: T;
  reason?: any;
}

export default async function pReflect<T>(
  promise: Promise<T>
): Promise<ReflectedPromise<T>> {
  try {
    const value = await promise;
    return {
      isFulfilled: true,
      isRejected: false,
      value,
    };
  } catch (reason) {
    return {
      isFulfilled: false,
      isRejected: true,
      reason,
    };
  }
}

export { pReflect };
