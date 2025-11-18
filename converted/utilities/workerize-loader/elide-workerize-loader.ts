/**
 * Elide workerize-loader - Webpack Worker Loader
 * NPM Package: workerize-loader | Weekly Downloads: ~500,000 | License: MIT
 */

export function createWorker(modulePath: string): any {
  return new Proxy({}, {
    get: (target, prop) => {
      return async (...args: any[]) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { worker: modulePath, method: prop, args };
      };
    }
  });
}

export default createWorker;
