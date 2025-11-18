/**
 * Rambdax - Extended Rambda
 *
 * Extended version of Rambda with extra utilities.
 * **POLYGLOT SHOWCASE**: One extended FP lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rambdax (~50K+ downloads/week)
 */

export const R = {
  map: <T, U>(fn: (item: T) => U, array: T[]): U[] => array.map(fn),
  filter: <T>(fn: (item: T) => boolean, array: T[]): T[] => array.filter(fn),
  reduce: <T, U>(fn: (acc: U, item: T) => U, init: U, array: T[]): U => array.reduce(fn, init),
  
  pipe: (...fns: Array<(arg: any) => any>) => (arg: any) =>
    fns.reduce((acc, fn) => fn(acc), arg),
  
  // Rambdax-specific utilities
  delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
  
  debounce: <T extends (...args: any[]) => any>(fn: T, ms: number) => {
    let timeout: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  },
  
  throttle: <T extends (...args: any[]) => any>(fn: T, ms: number) => {
    let lastTime = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= ms) {
        lastTime = now;
        return fn(...args);
      }
    };
  },
  
  tap: <T>(fn: (item: T) => void) => (item: T): T => {
    fn(item);
    return item;
  },
  
  unless: <T>(predicate: (item: T) => boolean, fn: (item: T) => T) => (item: T): T => {
    return predicate(item) ? item : fn(item);
  },
  
  when: <T>(predicate: (item: T) => boolean, fn: (item: T) => T) => (item: T): T => {
    return predicate(item) ? fn(item) : item;
  },
};

export default R;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Rambdax - Extended FP for Elide (POLYGLOT!)\n");

  console.log("map:", R.map(x => x * 2, [1, 2, 3]));
  console.log("filter:", R.filter(x => x % 2 === 0, [1, 2, 3, 4]));

  const process = R.pipe(
    R.tap((x: number[]) => console.log("Input:", x)),
    (x: number[]) => R.map(n => n * 2, x),
    (x: number[]) => R.filter(n => n > 3, x)
  );

  console.log("Piped result:", process([1, 2, 3]));

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~50K+ downloads/week on npm");
}
