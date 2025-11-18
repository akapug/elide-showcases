/**
 * Ramda - Functional Programming Library
 *
 * Practical functional library emphasizing immutability and pure functions.
 * **POLYGLOT SHOWCASE**: One FP library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ramda (~1M+ downloads/week)
 */

export const R = {
  add: (a: number) => (b: number) => a + b,
  multiply: (a: number) => (b: number) => a * b,
  subtract: (a: number) => (b: number) => a - b,
  divide: (a: number) => (b: number) => a / b,
  
  map: <T, U>(fn: (item: T) => U) => (array: T[]): U[] => array.map(fn),
  filter: <T>(fn: (item: T) => boolean) => (array: T[]): T[] => array.filter(fn),
  reduce: <T, U>(fn: (acc: U, item: T) => U, init: U) => (array: T[]): U =>
    array.reduce(fn, init),
  
  pipe: (...fns: Array<(arg: any) => any>) => (arg: any) =>
    fns.reduce((acc, fn) => fn(acc), arg),
  
  compose: (...fns: Array<(arg: any) => any>) => (arg: any) =>
    fns.reduceRight((acc, fn) => fn(acc), arg),
  
  curry: <T extends (...args: any[]) => any>(fn: T) => {
    return function curried(...args: any[]): any {
      if (args.length >= fn.length) {
        return fn(...args);
      }
      return (...nextArgs: any[]) => curried(...args, ...nextArgs);
    };
  },
  
  prop: <K extends string>(key: K) => <T extends Record<K, any>>(obj: T): T[K] => obj[key],
  path: (keys: string[]) => (obj: any): any =>
    keys.reduce((acc, key) => acc?.[key], obj),
  
  pick: <T extends object, K extends keyof T>(keys: K[]) => (obj: T): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) result[key] = obj[key];
    }
    return result;
  },
  
  omit: <T extends object, K extends keyof T>(keys: K[]) => (obj: T): Omit<T, K> => {
    const result = { ...obj } as any;
    for (const key of keys) delete result[key];
    return result;
  },
};

export default R;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔮 Ramda - Functional Programming for Elide (POLYGLOT!)\n");

  console.log("=== Curried Math ===");
  const add5 = R.add(5);
  const multiply3 = R.multiply(3);
  console.log("add(5)(10):", add5(10));
  console.log("multiply(3)(4):", multiply3(4));

  console.log("\n=== Function Composition ===");
  const process = R.pipe(
    R.map((x: number) => x * 2),
    R.filter((x: number) => x > 5)
  );
  console.log("pipe(map(*2), filter(>5))([1,2,3,4,5]):", process([1,2,3,4,5]));

  console.log("\n=== Object Operations ===");
  const getName = R.prop('name');
  const user = { name: "Alice", age: 25 };
  console.log("prop('name')({name:'Alice'}):", getName(user));

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~1M+ downloads/week on npm");
}
