/**
 * Elide P-Debounce - Debounce Promise-Returning Functions
 *
 * Pure TypeScript implementation of p-debounce.
 *
 * Features:
 * - Debounce async functions
 * - Trailing/leading edge
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-debounce (~2M downloads/week)
 */

export default function pDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | number | undefined;
  let latestResolve: ((value: any) => void) | undefined;
  let latestReject: ((error: any) => void) | undefined;

  return ((...args: any[]) => {
    return new Promise((resolve, reject) => {
      if (timeout !== undefined) {
        clearTimeout(timeout as any);
      }

      latestResolve = resolve;
      latestReject = reject;

      timeout = setTimeout(async () => {
        timeout = undefined;
        try {
          const result = await fn(...args);
          latestResolve?.(result);
        } catch (error) {
          latestReject?.(error);
        }
      }, wait);
    });
  }) as T;
}

export { pDebounce };
