/**
 * Underscore - Utility Library
 *
 * Functional programming helpers for everyday use.
 * **POLYGLOT SHOWCASE**: One utility library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/underscore (~2M+ downloads/week)
 */

export const _ = {
  each: <T>(array: T[], fn: (item: T, index: number) => void) => {
    for (let i = 0; i < array.length; i++) fn(array[i], i);
  },

  map: <T, U>(array: T[], fn: (item: T) => U): U[] => array.map(fn),

  filter: <T>(array: T[], fn: (item: T) => boolean): T[] => array.filter(fn),

  reduce: <T, U>(array: T[], fn: (acc: U, item: T) => U, init: U): U =>
    array.reduce(fn, init),

  find: <T>(array: T[], fn: (item: T) => boolean): T | undefined =>
    array.find(fn),

  pluck: <T, K extends keyof T>(array: T[], key: K): T[K][] =>
    array.map(item => item[key]),

  uniq: <T>(array: T[]): T[] => Array.from(new Set(array)),

  flatten: (array: any[], depth: number = Infinity): any[] => {
    return array.reduce((acc, item) => {
      if (Array.isArray(item) && depth > 0) {
        acc.push(..._.flatten(item, depth - 1));
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  },

  groupBy: <T>(array: T[], fn: (item: T) => string): Record<string, T[]> => {
    return array.reduce((acc, item) => {
      const key = fn(item);
      (acc[key] = acc[key] || []).push(item);
      return acc;
    }, {} as Record<string, T[]>);
  },

  sortBy: <T>(array: T[], fn: (item: T) => any): T[] => {
    return [...array].sort((a, b) => {
      const aVal = fn(a);
      const bVal = fn(b);
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  },

  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) result[key] = obj[key];
    }
    return result;
  },

  omit: <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as any;
    for (const key of keys) delete result[key];
    return result;
  },

  debounce: <T extends (...args: any[]) => any>(fn: T, wait: number) => {
    let timeout: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  },

  throttle: <T extends (...args: any[]) => any>(fn: T, wait: number) => {
    let lastTime = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        return fn(...args);
      }
    };
  },
};

export default _;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 Underscore - Utility Library for Elide (POLYGLOT!)\n");

  console.log("=== Collections ===");
  const nums = [1, 2, 3, 4, 5];
  console.log("map x*2:", _.map(nums, x => x * 2));
  console.log("filter even:", _.filter(nums, x => x % 2 === 0));
  console.log("reduce sum:", _.reduce(nums, (a, b) => a + b, 0));

  console.log("\n=== Objects ===");
  const user = { id: 1, name: "Alice", password: "secret" };
  console.log("pick:", _.pick(user, ["id", "name"]));
  console.log("omit:", _.omit(user, ["password"]));

  console.log("\n=== Arrays ===");
  console.log("uniq:", _.uniq([1, 2, 2, 3, 3, 3]));
  console.log("flatten:", _.flatten([[1, 2], [3, [4, 5]]]));

  const people = [
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Charlie", age: 25 }
  ];
  console.log("groupBy age:", _.groupBy(people, p => p.age.toString()));
  console.log("pluck names:", _.pluck(people, "name"));

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~2M+ downloads/week on npm");
}
