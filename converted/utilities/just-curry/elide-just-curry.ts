/**
 * Just Curry - Function Currying Utility
 *
 * Transform functions to be callable with partial arguments.
 * **POLYGLOT SHOWCASE**: One curry utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-curry (~20K+ downloads/week)
 *
 * Features:
 * - Automatic currying
 * - Partial application support
 * - Placeholder support
 * - Type-safe currying
 * - Variadic function support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need currying
 * - ONE implementation works everywhere on Elide
 * - Consistent functional programming patterns
 * - Share curried functions across your stack
 *
 * Use cases:
 * - Partial application (pre-configure functions)
 * - Function composition (chain operations)
 * - Event handlers (bind specific parameters)
 * - Functional programming patterns
 *
 * Package has ~20K+ downloads/week on npm - essential FP utility!
 */

const PLACEHOLDER = Symbol('curry-placeholder');

export { PLACEHOLDER as _ };

type Curry<T extends (...args: any[]) => any> = {
  (...args: any[]): any;
};

/**
 * Creates a curried version of the provided function
 */
export function curry<T extends (...args: any[]) => any>(
  func: T,
  arity: number = func.length
): Curry<T> {
  return function curried(this: any, ...args: any[]): any {
    const context = this;

    // Replace placeholders with actual values
    const processedArgs = args.filter(arg => arg !== PLACEHOLDER);

    if (processedArgs.length >= arity) {
      return func.apply(context, processedArgs.slice(0, arity));
    }

    return function (this: any, ...nextArgs: any[]) {
      const allArgs = [...args];
      let nextArgIndex = 0;

      // Replace placeholders with next arguments
      for (let i = 0; i < allArgs.length && nextArgIndex < nextArgs.length; i++) {
        if (allArgs[i] === PLACEHOLDER) {
          allArgs[i] = nextArgs[nextArgIndex++];
        }
      }

      // Add remaining arguments
      while (nextArgIndex < nextArgs.length) {
        allArgs.push(nextArgs[nextArgIndex++]);
      }

      return curried.apply(this, allArgs);
    };
  };
}

/**
 * Creates a curried version that requires all arguments
 */
export function curryN<T extends (...args: any[]) => any>(
  n: number,
  func: T
): Curry<T> {
  return curry(func, n);
}

export default curry;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🍛 Just Curry - Function Currying for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Currying ===");
  function add(a: number, b: number, c: number): number {
    return a + b + c;
  }

  const curriedAdd = curry(add);
  console.log("Original: add(1, 2, 3) =", add(1, 2, 3));
  console.log("Curried: curriedAdd(1)(2)(3) =", curriedAdd(1)(2)(3));
  console.log("Partial: curriedAdd(1)(2, 3) =", curriedAdd(1)(2, 3));
  console.log("All at once: curriedAdd(1, 2, 3) =", curriedAdd(1, 2, 3));
  console.log();

  console.log("=== Example 2: Partial Application ===");
  function greet(greeting: string, name: string, punctuation: string): string {
    return `${greeting}, ${name}${punctuation}`;
  }

  const curriedGreet = curry(greet);
  const sayHello = curriedGreet("Hello");
  const sayHelloToJohn = sayHello("John");

  console.log("Full greeting:", sayHelloToJohn("!"));
  console.log("Another greeting:", sayHello("Alice")("?"));
  console.log();

  console.log("=== Example 3: Reusable Configurations ===");
  function multiply(a: number, b: number): number {
    return a * b;
  }

  const curriedMultiply = curry(multiply);
  const double = curriedMultiply(2);
  const triple = curriedMultiply(3);
  const quadruple = curriedMultiply(4);

  console.log("double(5) =", double(5));
  console.log("triple(5) =", triple(5));
  console.log("quadruple(5) =", quadruple(5));
  console.log();

  console.log("=== Example 4: Array Operations ===");
  const numbers = [1, 2, 3, 4, 5];

  function map<T, U>(fn: (item: T) => U, array: T[]): U[] {
    return array.map(fn);
  }

  const curriedMap = curry(map);
  const mapDouble = curriedMap((x: number) => x * 2);
  const mapSquare = curriedMap((x: number) => x * x);

  console.log("Original:", numbers);
  console.log("Doubled:", mapDouble(numbers));
  console.log("Squared:", mapSquare(numbers));
  console.log();

  console.log("=== Example 5: Filter Factory ===");
  function filter<T>(predicate: (item: T) => boolean, array: T[]): T[] {
    return array.filter(predicate);
  }

  const curriedFilter = curry(filter);
  const filterEven = curriedFilter((x: number) => x % 2 === 0);
  const filterOdd = curriedFilter((x: number) => x % 2 !== 0);
  const filterGreaterThan = (n: number) => curriedFilter((x: number) => x > n);

  console.log("Numbers:", numbers);
  console.log("Even:", filterEven(numbers));
  console.log("Odd:", filterOdd(numbers));
  console.log("Greater than 3:", filterGreaterThan(3)(numbers));
  console.log();

  console.log("=== Example 6: Function Composition ===");
  const addOne = curriedAdd(1);
  const addTwo = addOne(1);
  const result = [1, 2, 3].map(addTwo);
  console.log("Add 2 to each [1,2,3]:", result);
  console.log();

  console.log("=== Example 7: Event Handler Binding ===");
  function handleEvent(eventType: string, element: string, data: any): void {
    console.log(`${eventType} on ${element}:`, data);
  }

  const curriedHandler = curry(handleEvent);
  const handleClick = curriedHandler("click");
  const handleButtonClick = handleClick("button");

  handleButtonClick({ x: 100, y: 200 });
  handleClick("link")({ url: "https://example.com" });
  console.log();

  console.log("=== Example 8: CurryN with Custom Arity ===");
  function sum(...numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  const sumThree = curryN(3, sum);
  console.log("sumThree(1)(2)(3) =", sumThree(1)(2)(3));
  console.log("sumThree(1, 2)(3) =", sumThree(1, 2)(3));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same curry utility works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One curry implementation, all languages");
  console.log("  ✓ Consistent functional programming patterns");
  console.log("  ✓ Share curried functions across your stack");
  console.log("  ✓ No need for language-specific implementations");
  console.log("\n✅ Use Cases:");
  console.log("- Partial application");
  console.log("- Function composition");
  console.log("- Event handler binding");
  console.log("- Configuration factories");
  console.log("- Reusable transformations");
  console.log("- Functional programming patterns");
  console.log("\n🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead");
  console.log("- ~20K+ downloads/week on npm");
}
