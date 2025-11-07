/**
 * Tiny Invariant - Compact Assertion Function
 *
 * A tiny invariant function for checking conditions and throwing errors.
 * Essential for runtime assertions, development checks, and production safety.
 *
 * Features:
 * - Compact assertion function
 * - TypeScript assertion signature
 * - Production-safe (can be stripped)
 * - Minimal bundle size
 * - Custom error messages
 *
 * Use cases:
 * - Runtime assertions
 * - Type narrowing
 * - Null/undefined checks
 * - Development validation
 * - Production error handling
 *
 * Package has ~20M+ downloads/week on npm!
 */

/**
 * Throw an error if condition is falsy
 */
export default function invariant(
  condition: any,
  message?: string
): asserts condition {
  if (condition) {
    return;
  }

  const prefix = 'Invariant failed';
  const value = message ? `${prefix}: ${message}` : prefix;

  throw new Error(value);
}

/**
 * Create invariant with custom prefix
 */
export function createInvariant(prefix: string) {
  return function customInvariant(
    condition: any,
    message?: string
  ): asserts condition {
    if (condition) {
      return;
    }

    const value = message ? `${prefix}: ${message}` : prefix;
    throw new Error(value);
  };
}

// CLI Demo
if (import.meta.url.includes("elide-tiny-invariant.ts")) {
  console.log("✓ Tiny Invariant - Assertions for Elide\n");

  console.log("=== Example 1: Basic Assertions ===");
  try {
    invariant(true, "This passes");
    console.log("✓ Passed: true condition");

    invariant(1 === 1, "Math works");
    console.log("✓ Passed: 1 === 1");

    invariant(false, "This will throw");
    console.log("✗ Should not reach here");
  } catch (e) {
    console.log("✗ Caught:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 2: Null/Undefined Checks ===");
  function processUser(user: any) {
    invariant(user, "User is required");
    invariant(user.name, "User name is required");
    return `Hello, ${user.name}!`;
  }

  try {
    console.log(processUser({ name: "Alice" }));
    console.log(processUser(null));
  } catch (e) {
    console.log("Caught:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 3: Type Narrowing ===");
  function getValue(input: string | null): string {
    invariant(input !== null, "Input cannot be null");
    // TypeScript knows input is string here
    return input.toUpperCase();
  }

  console.log("getValue('hello'):", getValue("hello"));
  try {
    getValue(null);
  } catch (e) {
    console.log("getValue(null) error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 4: Array Validation ===");
  function getFirst<T>(arr: T[]): T {
    invariant(arr.length > 0, "Array must not be empty");
    return arr[0];
  }

  console.log("getFirst([1,2,3]):", getFirst([1, 2, 3]));
  try {
    getFirst([]);
  } catch (e) {
    console.log("getFirst([]) error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 5: Configuration Validation ===");
  interface Config {
    apiKey?: string;
    endpoint?: string;
  }

  function initializeAPI(config: Config) {
    invariant(config.apiKey, "API key is required");
    invariant(config.endpoint, "API endpoint is required");
    console.log(`Initialized with ${config.endpoint}`);
  }

  try {
    initializeAPI({ apiKey: "abc123", endpoint: "https://api.example.com" });
    initializeAPI({ apiKey: "abc123" } as Config);
  } catch (e) {
    console.log("Config error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 6: Index Bounds Check ===");
  function safeArrayAccess<T>(arr: T[], index: number): T {
    invariant(index >= 0, "Index must be non-negative");
    invariant(index < arr.length, "Index out of bounds");
    return arr[index];
  }

  const arr = ["a", "b", "c"];
  console.log("arr[1]:", safeArrayAccess(arr, 1));
  try {
    safeArrayAccess(arr, 10);
  } catch (e) {
    console.log("arr[10] error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 7: State Validation ===");
  class Counter {
    private count = 0;

    increment() {
      this.count++;
    }

    decrement() {
      invariant(this.count > 0, "Cannot decrement below zero");
      this.count--;
    }

    getCount() {
      return this.count;
    }
  }

  const counter = new Counter();
  counter.increment();
  counter.decrement();
  console.log("Counter after inc/dec:", counter.getCount());

  try {
    counter.decrement();
  } catch (e) {
    console.log("Decrement error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 8: Custom Prefix ===");
  const apiInvariant = createInvariant("API Error");

  try {
    apiInvariant(false, "Invalid request");
  } catch (e) {
    console.log("Custom prefix:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 9: Function Arguments ===");
  function divide(a: number, b: number): number {
    invariant(typeof a === "number", "First argument must be a number");
    invariant(typeof b === "number", "Second argument must be a number");
    invariant(b !== 0, "Cannot divide by zero");
    return a / b;
  }

  console.log("10 / 2 =", divide(10, 2));
  try {
    divide(10, 0);
  } catch (e) {
    console.log("Divide by zero:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 10: Object Property Validation ===");
  interface Person {
    name: string;
    age: number;
    email: string;
  }

  function validatePerson(person: any): asserts person is Person {
    invariant(person, "Person object is required");
    invariant(typeof person.name === "string", "Name must be a string");
    invariant(typeof person.age === "number", "Age must be a number");
    invariant(person.age >= 0, "Age must be non-negative");
    invariant(typeof person.email === "string", "Email must be a string");
    invariant(person.email.includes("@"), "Email must be valid");
  }

  const validPerson = { name: "Alice", age: 25, email: "alice@example.com" };
  validatePerson(validPerson);
  console.log("✓ Valid person:", validPerson.name);

  try {
    validatePerson({ name: "Bob", age: -5, email: "invalid" });
  } catch (e) {
    console.log("Invalid person:", (e as Error).message);
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Runtime assertions and validation");
  console.log("- Type narrowing in TypeScript");
  console.log("- Null/undefined safety checks");
  console.log("- Development time validation");
  console.log("- Production error handling");
  console.log("- API input validation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Minimal overhead (single condition check)");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~20M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use for critical assertions");
  console.log("- TypeScript 'asserts' keyword for type narrowing");
  console.log("- Can be stripped in production with bundlers");
  console.log("- Clearer than if/throw patterns");
}
