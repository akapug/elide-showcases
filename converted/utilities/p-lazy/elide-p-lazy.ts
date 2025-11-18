/**
 * Elide P-Lazy - Lazy Promises
 *
 * Pure TypeScript implementation of p-lazy.
 *
 * Features:
 * - Lazy promise execution
 * - Execute only when needed
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-lazy (~2M downloads/week)
 */

export default class PLazy<T> extends Promise<T> {
  private executor: (resolve: (value: T) => void, reject: (error: any) => void) => void;
  private hasExecuted = false;
  private promise?: Promise<T>;

  constructor(executor: (resolve: (value: T) => void, reject: (error: any) => void) => void) {
    let actualResolve: (value: T) => void;
    let actualReject: (error: any) => void;

    super((resolve, reject) => {
      actualResolve = resolve;
      actualReject = reject;
    });

    this.executor = executor;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    if (!this.hasExecuted) {
      this.hasExecuted = true;
      this.promise = new Promise(this.executor);
    }
    return this.promise!.then(onfulfilled, onrejected);
  }
}

export { PLazy };
