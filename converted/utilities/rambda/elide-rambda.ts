/**
 * Rambda - Lighter Ramda Alternative
 *
 * Faster, smaller alternative to Ramda with essential FP utilities.
 * **POLYGLOT SHOWCASE**: One lightweight FP library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rambda (~200K+ downloads/week)
 */

export const R = {
  map: <T, U>(fn: (item: T) => U, array: T[]): U[] => array.map(fn),
  filter: <T>(fn: (item: T) => boolean, array: T[]): T[] => array.filter(fn),
  reduce: <T, U>(fn: (acc: U, item: T) => U, init: U, array: T[]): U => array.reduce(fn, init),
  
  pipe: (...fns: Array<(arg: any) => any>) => (arg: any) =>
    fns.reduce((acc, fn) => fn(acc), arg),
  
  prop: <K extends string>(key: K, obj: Record<K, any>) => obj[key],
  pick: <T extends object, K extends keyof T>(keys: K[], obj: T): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) result[key] = obj[key];
    }
    return result;
  },
  
  uniq: <T>(array: T[]): T[] => Array.from(new Set(array)),
  flatten: (array: any[]): any[] => array.flat(Infinity),
};

export default R;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Rambda - Lightweight FP for Elide (POLYGLOT!)\n");
  console.log("map:", R.map(x => x * 2, [1, 2, 3]));
  console.log("filter:", R.filter(x => x % 2 === 0, [1, 2, 3, 4]));
  console.log("uniq:", R.uniq([1, 2, 2, 3]));
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~200K+ downloads/week on npm");
}
