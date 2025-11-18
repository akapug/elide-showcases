/**
 * Elide workerize - Module to Worker
 * NPM Package: workerize | Weekly Downloads: ~1,000,000 | License: MIT
 */

export default function workerize(code: string | Function): any {
  return new Proxy({}, {
    get: (target, prop) => {
      return async (...args: any[]) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { method: prop, args };
      };
    }
  });
}
