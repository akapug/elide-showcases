/**
 * Bluebird - Full-featured promise library
 * Based on https://www.npmjs.com/package/bluebird (~7M downloads/week)
 */

export class BluebirdPromise<T> extends Promise<T> {
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static map<T, U>(arr: T[], fn: (item: T) => Promise<U>): Promise<U[]> {
    return Promise.all(arr.map(fn));
  }

  static filter<T>(arr: T[], fn: (item: T) => Promise<boolean>): Promise<T[]> {
    return Promise.all(
      arr.map(async item => ({ item, keep: await fn(item) }))
    ).then(results => results.filter(r => r.keep).map(r => r.item));
  }

  static all<T>(promises: Array<Promise<T>>): Promise<T[]> {
    return Promise.all(promises);
  }

  static props<T extends Record<string, Promise<any>>>(obj: T): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const keys = Object.keys(obj);
    return Promise.all(keys.map(k => obj[k])).then(values => {
      const result: any = {};
      keys.forEach((k, i) => result[k] = values[i]);
      return result;
    });
  }
}

export default BluebirdPromise;

if (import.meta.url.includes("bluebird.ts")) {
  console.log("🐦 Bluebird - Promise library for Elide\n");
  console.log("Features: delay, map, filter, all, props");
  console.log("~7M+ downloads/week on npm!");
}
