/**
 * Elide Delay - Delay Utility
 *
 * Pure TypeScript implementation of delay.
 *
 * Features:
 * - Delay execution
 * - Return values after delay
 * - Clearable delays
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: delay (~15M downloads/week)
 */

export interface ClearablePromise<T> extends Promise<T> {
  clear(): void;
}

export default function delay<T = void>(
  ms: number,
  options?: { value?: T; signal?: AbortSignal }
): ClearablePromise<T> {
  let timeoutId: NodeJS.Timeout | number;
  let rejectFn: (reason?: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    rejectFn = reject;

    if (options?.signal?.aborted) {
      reject(new Error('Delay aborted'));
      return;
    }

    timeoutId = setTimeout(() => {
      resolve(options?.value as T);
    }, ms);

    options?.signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId as any);
      reject(new Error('Delay aborted'));
    });
  }) as ClearablePromise<T>;

  promise.clear = () => {
    clearTimeout(timeoutId as any);
    rejectFn(new Error('Delay cleared'));
  };

  return promise;
}

export { delay };
