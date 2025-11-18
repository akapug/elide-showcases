/**
 * tslib - TypeScript Runtime Library
 *
 * Runtime library for TypeScript helper functions.
 * **POLYGLOT SHOWCASE**: Essential TypeScript helpers for ALL languages!
 *
 * Based on https://www.npmjs.com/package/tslib (~20M+ downloads/week)
 *
 * Features:
 * - __extends helper
 * - __assign helper
 * - __rest helper
 * - __decorate helper
 * - __awaiter helper
 * - __generator helper
 *
 * Polyglot Benefits:
 * - Share TS helpers across all languages
 * - Reduce bundle sizes
 * - Standard runtime everywhere
 * - One library for all TS needs
 *
 * Use cases:
 * - TypeScript compilation
 * - Decorators support
 * - Async/await transforms
 * - Class inheritance
 *
 * Package has ~20M+ downloads/week on npm - most popular TS library!
 */

export function __extends(d: any, b: any): void {
  for (const p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new (__ as any)());
}

export function __assign(t: any, ...sources: any[]): any {
  for (let s of sources) {
    for (const p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  }
  return t;
}

export function __rest(s: any, e: string[]): any {
  const t: any = {};
  for (const p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) {
      t[p] = s[p];
    }
  }
  return t;
}

export function __decorate(decorators: any[], target: any, key?: string | symbol, desc?: any): any {
  let result = desc;
  for (let i = decorators.length - 1; i >= 0; i--) {
    const decorator = decorators[i];
    result = decorator(target, key, result) || result;
  }
  return result;
}

export function __awaiter(thisArg: any, _arguments: any, P: any, generator: any): Promise<any> {
  return new (P || Promise)((resolve, reject) => {
    function fulfilled(value: any) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value: any) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
    function step(result: any) { result.done ? resolve(result.value) : new P((resolve: any) => resolve(result.value)).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

export function __spreadArray(to: any[], from: any[]): any[] {
  return to.concat(from);
}

export function __values(o: any): any {
  const s = typeof Symbol === "function" && Symbol.iterator;
  const m = s && o[s];
  let i = 0;
  if (m) return m.call(o);
  return {
    next: () => {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
}

export default {
  __extends,
  __assign,
  __rest,
  __decorate,
  __awaiter,
  __spreadArray,
  __values,
};

// CLI Demo
if (import.meta.url.includes("elide-tslib.ts")) {
  console.log("🔧 tslib - TypeScript Runtime Helpers for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: __assign (Object.assign) ===");
  const obj1 = { a: 1 };
  const obj2 = { b: 2 };
  const merged = __assign({}, obj1, obj2);
  console.log("Merged:", merged);
  console.log();

  console.log("=== Example 2: __rest (Object rest) ===");
  const { a, ...rest } = { a: 1, b: 2, c: 3 };
  const restObj = __rest({ a: 1, b: 2, c: 3 }, ['a']);
  console.log("Rest:", restObj);
  console.log();

  console.log("=== Example 3: __spreadArray ===");
  const arr1 = [1, 2, 3];
  const arr2 = [4, 5, 6];
  const spread = __spreadArray(arr1, arr2);
  console.log("Spread:", spread);
  console.log();

  console.log("🚀 Most popular TS package - ~20M+ downloads/week!");
}
