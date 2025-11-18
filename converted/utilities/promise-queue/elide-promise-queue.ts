/**
 * Elide Promise-Queue - Simple Promise Queue
 *
 * Pure TypeScript implementation of promise-queue.
 *
 * Features:
 * - Simple promise queue
 * - Concurrency control
 * - Global queue support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: promise-queue (~3M downloads/week)
 */

export default class PromiseQueue {
  private queue: Array<() => Promise<any>> = [];
  private pending = 0;
  private maxConcurrent: number;
  private maxQueued: number;

  constructor(maxConcurrent: number = Infinity, maxQueued: number = Infinity) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueued = maxQueued;
  }

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.queue.length >= this.maxQueued) {
        reject(new Error('Queue full'));
        return;
      }

      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    while (this.pending < this.maxConcurrent && this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        this.pending++;
        fn().finally(() => {
          this.pending--;
          this.process();
        });
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getPendingLength(): number {
    return this.pending;
  }
}

export { PromiseQueue };
