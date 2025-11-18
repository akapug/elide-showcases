/**
 * Ramda for Elide - Functional Programming Library
 *
 * Pure functional programming utilities:
 * - Auto-curried functions
 * - Immutable data transformations
 * - Point-free style support
 * - Composition and piping
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 5M+ downloads/week
 */

// Core functional utilities
export const curry = <T extends (...args: any[]) => any>(fn: T): any => {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn.apply(null, args);
    }
    return (...moreArgs: any[]) => curried(...args, ...moreArgs);
  };
};

export const compose = (...fns: Function[]) => (x: any) =>
  fns.reduceRight((acc, fn) => fn(acc), x);

export const pipe = (...fns: Function[]) => (x: any) =>
  fns.reduce((acc, fn) => fn(acc), x);

// List functions (all curried)
export const map = curry(<T, U>(fn: (x: T) => U, list: T[]): U[] =>
  list.map(fn)
);

export const filter = curry(<T>(fn: (x: T) => boolean, list: T[]): T[] =>
  list.filter(fn)
);

export const reduce = curry(<T, U>(fn: (acc: U, val: T) => U, initial: U, list: T[]): U =>
  list.reduce(fn, initial)
);

export const head = <T>(list: T[]): T | undefined => list[0];

export const tail = <T>(list: T[]): T[] => list.slice(1);

export const take = curry(<T>(n: number, list: T[]): T[] => list.slice(0, n));

export const drop = curry(<T>(n: number, list: T[]): T[] => list.slice(n));

export const append = curry(<T>(val: T, list: T[]): T[] => [...list, val]);

export const prepend = curry(<T>(val: T, list: T[]): T[] => [val, ...list]);

export const concat = curry(<T>(list1: T[], list2: T[]): T[] => [...list1, ...list2]);

export const reverse = <T>(list: T[]): T[] => [...list].reverse();

export const uniq = <T>(list: T[]): T[] => Array.from(new Set(list));

export const flatten = (list: any[]): any[] => list.flat(Infinity);

export const pluck = curry(<T, K extends keyof T>(key: K, list: T[]): T[K][] =>
  list.map(item => item[key])
);

export const groupBy = curry(<T>(fn: (x: T) => string, list: T[]): Record<string, T[]> =>
  list.reduce((acc, item) => {
    const key = fn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>)
);

// Object functions
export const prop = curry(<T, K extends keyof T>(key: K, obj: T): T[K] => obj[key]);

export const pick = curry(<T extends object, K extends keyof T>(
  keys: K[],
  obj: T
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
});

export const omit = curry(<T extends object, K extends keyof T>(
  keys: K[],
  obj: T
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
});

export const merge = curry(<T extends object>(obj1: Partial<T>, obj2: Partial<T>): T =>
  Object.assign({}, obj1, obj2) as T
);

export const keys = <T extends object>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

export const values = <T extends object>(obj: T): T[keyof T][] =>
  Object.values(obj);

export const toPairs = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
  Object.entries(obj) as [keyof T, T[keyof T]][];

export const fromPairs = <K extends string | number | symbol, V>(
  pairs: [K, V][]
): Record<K, V> => {
  const result = {} as Record<K, V>;
  pairs.forEach(([k, v]) => result[k] = v);
  return result;
};

// Logic functions
export const not = (x: boolean): boolean => !x;

export const and = curry((a: boolean, b: boolean): boolean => a && b);

export const or = curry((a: boolean, b: boolean): boolean => a || b);

export const equals = curry(<T>(a: T, b: T): boolean =>
  JSON.stringify(a) === JSON.stringify(b)
);

export const gt = curry((a: number, b: number): boolean => b > a);

export const lt = curry((a: number, b: number): boolean => b < a);

export const gte = curry((a: number, b: number): boolean => b >= a);

export const lte = curry((a: number, b: number): boolean => b <= a);

// Math functions
export const add = curry((a: number, b: number): number => a + b);

export const subtract = curry((a: number, b: number): number => b - a);

export const multiply = curry((a: number, b: number): number => a * b);

export const divide = curry((a: number, b: number): number => b / a);

export const inc = (x: number): number => x + 1;

export const dec = (x: number): number => x - 1;

export const negate = (x: number): number => -x;

export const sum = (list: number[]): number => list.reduce((a, b) => a + b, 0);

export const product = (list: number[]): number => list.reduce((a, b) => a * b, 1);

export const mean = (list: number[]): number => sum(list) / list.length;

// String functions
export const toUpper = (str: string): string => str.toUpperCase();

export const toLower = (str: string): string => str.toLowerCase();

export const split = curry((sep: string, str: string): string[] => str.split(sep));

export const join = curry((sep: string, list: string[]): string => list.join(sep));

export const trim = (str: string): string => str.trim();

export const replace = curry((pattern: string | RegExp, replacement: string, str: string): string =>
  str.replace(pattern, replacement)
);

// Utility functions
export const identity = <T>(x: T): T => x;

export const always = <T>(x: T): () => T => () => x;

export const T = (): boolean => true;

export const F = (): boolean => false;

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export const path = curry(<T = any>(pathArray: (string | number)[], obj: any): T | undefined => {
  let result = obj;
  for (const key of pathArray) {
    if (result == null) return undefined;
    result = result[key];
  }
  return result;
});

// CLI Demo
if (import.meta.url.includes("ramda")) {
  console.log("🎯 Ramda for Elide - Functional Programming\n");

  console.log("=== Currying ===");
  const add3 = add(3);
  console.log("add(3)(5):", add3(5));
  console.log("map(inc, [1,2,3]):", map(inc, [1,2,3]));
  console.log();

  console.log("=== Composition ===");
  const double = (x: number) => x * 2;
  const addOne = (x: number) => x + 1;
  const doubleThenAddOne = compose(addOne, double);
  console.log("compose(addOne, double)(5):", doubleThenAddOne(5));

  const addOneThenDouble = pipe(addOne, double);
  console.log("pipe(addOne, double)(5):", addOneThenDouble(5));
  console.log();

  console.log("=== Point-Free Style ===");
  const numbers = [1, 2, 3, 4, 5];
  const doubled = map(multiply(2), numbers);
  console.log("map(multiply(2), [1,2,3,4,5]):", doubled);
  console.log();

  console.log("=== Data Transformation ===");
  const users = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 25 }
  ];
  const ages = pluck('age', users);
  console.log("pluck('age', users):", ages);
  const byAge = groupBy((u: any) => u.age, users);
  console.log("groupBy(age, users):", byAge);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Functional programming");
  console.log("- Point-free style");
  console.log("- Data pipelines");
  console.log("- Immutable transformations");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 5M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Auto-curried functions");
}

export default {
  curry, compose, pipe,
  map, filter, reduce, head, tail, take, drop, append, prepend, concat, reverse, uniq, flatten, pluck, groupBy,
  prop, pick, omit, merge, keys, values, toPairs, fromPairs,
  not, and, or, equals, gt, lt, gte, lte,
  add, subtract, multiply, divide, inc, dec, negate, sum, product, mean,
  toUpper, toLower, split, join, trim, replace,
  identity, always, T, F, clone, path
};
