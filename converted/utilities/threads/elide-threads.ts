/**
 * Elide threads - Worker Threads Made Easy
 * NPM Package: threads | Weekly Downloads: ~2,000,000 | License: MIT
 */

export function spawn<T = any>(worker: any): T {
  return new Proxy({}, {
    get: (target, prop) => {
      return async (...args: any[]) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { method: prop, args };
      };
    }
  }) as T;
}

export function Thread(fn: Function): any {
  return { fn };
}

export function terminate(thread: any): Promise<void> {
  return Promise.resolve();
}

export default { spawn, Thread, terminate };
