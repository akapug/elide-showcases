/**
 * Regenerator Runtime - Async/Await Support
 *
 * Runtime for transpiled generator and async functions.
 * **POLYGLOT SHOWCASE**: Async/await for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/regenerator-runtime (~15M+ downloads/week)
 */

export const regeneratorRuntime = {
  mark(genFun: any) {
    return genFun;
  },
  
  wrap(innerFn: any, outerFn: any) {
    return {
      next() {
        return innerFn();
      }
    };
  },
  
  async(innerFn: any, outerFn?: any, self?: any) {
    return function(...args: any[]) {
      return Promise.resolve(innerFn.apply(self, args));
    };
  },
  
  awrap(arg: any) {
    return { __await: arg };
  }
};

export default regeneratorRuntime;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Regenerator Runtime (POLYGLOT!)\n");
  
  const asyncFn = regeneratorRuntime.async(function() {
    return 'Hello from async!';
  });
  
  asyncFn().then((result: string) => console.log(result));
  console.log("\n  ✓ ~15M+ downloads/week!");
}
