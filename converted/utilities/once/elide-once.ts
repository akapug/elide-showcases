/**
 * Once - Run a Function Exactly One Time
 *
 * Core features:
 * - Single execution guarantee
 * - Result caching
 * - This binding support
 * - Strict mode
 * - Function wrapper
 * - Simple API
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 120M+ downloads/week
 */

export type OnceFunction<T extends (...args: any[]) => any> = T & {
  called: boolean;
};

/**
 * Ensure a function is called only once
 */
export function once<T extends (...args: any[]) => any>(fn: T): OnceFunction<T> {
  let called = false;
  let result: any;

  const wrapped = function (this: any, ...args: any[]) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    return result;
  } as OnceFunction<T>;

  Object.defineProperty(wrapped, 'called', {
    get() {
      return called;
    },
    enumerable: true,
  });

  return wrapped;
}

/**
 * Strict version - throws if called more than once
 */
export function strict<T extends (...args: any[]) => any>(fn: T): OnceFunction<T> {
  let called = false;
  let result: any;

  const wrapped = function (this: any, ...args: any[]) {
    if (called) {
      throw new Error('Function called more than once');
    }
    called = true;
    result = fn.apply(this, args);
    return result;
  } as OnceFunction<T>;

  Object.defineProperty(wrapped, 'called', {
    get() {
      return called;
    },
    enumerable: true,
  });

  return wrapped;
}

if (import.meta.url.includes("once")) {
  console.log("🔒 Once for Elide - Run Function Once\n");

  console.log("=== Basic Usage ===");
  let callCount = 0;
  const initialize = once(() => {
    callCount++;
    console.log("Initializing...");
    return "initialized";
  });

  console.log("First call:", initialize());
  console.log("Second call:", initialize());
  console.log("Third call:", initialize());
  console.log("Call count:", callCount);
  console.log("Was called:", initialize.called);

  console.log("\n=== With Arguments ===");
  const greet = once((name: string) => {
    console.log(`Hello, ${name}!`);
    return `Greeted ${name}`;
  });

  console.log(greet("Alice"));
  console.log(greet("Bob")); // Returns cached result

  console.log("\n=== Strict Mode ===");
  const strictFn = strict(() => {
    console.log("Strict function called");
    return 42;
  });

  console.log("First call:", strictFn());
  try {
    strictFn(); // This will throw
  } catch (err) {
    console.log("Error:", (err as Error).message);
  }

  console.log("\n=== This Binding ===");
  const obj = {
    name: "MyObject",
    init: once(function (this: any) {
      console.log("Init called on:", this.name);
      return "done";
    }),
  };

  console.log(obj.init());

  console.log();
  console.log("✅ Use Cases: Initialization, Singleton pattern, Callbacks");
  console.log("🚀 120M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default once;
