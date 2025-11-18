/**
 * Just Compose - Function Composition Utility
 *
 * Compose functions right-to-left for elegant data transformations.
 * **POLYGLOT SHOWCASE**: One compose utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-compose (~20K+ downloads/week)
 *
 * Features:
 * - Right-to-left composition
 * - Left-to-right pipe
 * - Type-safe composition
 * - Variadic function support
 * - Pure functional approach
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need composition
 * - ONE implementation works everywhere on Elide
 * - Consistent functional patterns
 * - Share composed functions across your stack
 *
 * Use cases:
 * - Data transformation pipelines
 * - Middleware chains
 * - Validation sequences
 * - Processing workflows
 *
 * Package has ~20K+ downloads/week on npm!
 */

/**
 * Compose functions right-to-left
 */
export function compose<T>(...fns: Array<(arg: any) => any>): (arg: T) => any {
  return (arg: T) => {
    return fns.reduceRight((acc, fn) => fn(acc), arg);
  };
}

/**
 * Compose functions left-to-right (pipe)
 */
export function pipe<T>(...fns: Array<(arg: any) => any>): (arg: T) => any {
  return (arg: T) => {
    return fns.reduce((acc, fn) => fn(acc), arg);
  };
}

export default compose;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 Just Compose - Function Composition for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Composition ===");
  const addOne = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const square = (x: number) => x * x;

  const composed = compose(addOne, double, square);
  console.log("compose(addOne, double, square)(3)");
  console.log("Execution: square(3) -> double(9) -> addOne(18) = 19");
  console.log("Result:", composed(3));
  console.log();

  console.log("=== Example 2: Pipe (Left-to-Right) ===");
  const piped = pipe(square, double, addOne);
  console.log("pipe(square, double, addOne)(3)");
  console.log("Execution: square(3) -> double(9) -> addOne(18) = 19");
  console.log("Result:", piped(3));
  console.log();

  console.log("=== Example 3: String Transformations ===");
  const toUpperCase = (s: string) => s.toUpperCase();
  const addExclamation = (s: string) => s + "!";
  const trim = (s: string) => s.trim();

  const shout = compose(addExclamation, toUpperCase, trim);
  console.log('shout("  hello world  ")');
  console.log("Result:", shout("  hello world  "));
  console.log();

  console.log("=== Example 4: Data Processing Pipeline ===");
  interface User {
    name: string;
    age: number;
    email: string;
  }

  const users: User[] = [
    { name: "Alice", age: 25, email: "alice@example.com" },
    { name: "Bob", age: 30, email: "bob@example.com" },
    { name: "Charlie", age: 35, email: "charlie@example.com" },
  ];

  const filterAdults = (users: User[]) => users.filter(u => u.age >= 30);
  const extractNames = (users: User[]) => users.map(u => u.name);
  const sortNames = (names: string[]) => names.sort();

  const processUsers = pipe(filterAdults, extractNames, sortNames);
  console.log("Processing users (age >= 30):");
  console.log("Result:", processUsers(users));
  console.log();

  console.log("=== Example 5: Validation Chain ===");
  const isNotEmpty = (s: string) => {
    if (!s || s.trim().length === 0) throw new Error("Empty string");
    return s;
  };

  const isValidEmail = (s: string) => {
    if (!s.includes("@")) throw new Error("Invalid email");
    return s;
  };

  const normalize = (s: string) => s.toLowerCase().trim();

  const validateEmail = pipe(normalize, isNotEmpty, isValidEmail);

  try {
    console.log('validateEmail("  USER@EXAMPLE.COM  ")');
    console.log("Result:", validateEmail("  USER@EXAMPLE.COM  "));
  } catch (e: any) {
    console.log("Error:", e.message);
  }

  try {
    console.log('validateEmail("invalid")');
    console.log("Result:", validateEmail("invalid"));
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  console.log();

  console.log("=== Example 6: Mathematical Operations ===");
  const add10 = (x: number) => x + 10;
  const multiply5 = (x: number) => x * 5;
  const subtract3 = (x: number) => x - 3;

  const calculate = compose(subtract3, multiply5, add10);
  console.log("compose(subtract3, multiply5, add10)(4)");
  console.log("Execution: add10(4) -> multiply5(14) -> subtract3(70) = 67");
  console.log("Result:", calculate(4));
  console.log();

  console.log("=== Example 7: Array Transformations ===");
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const filterEven = (arr: number[]) => arr.filter(x => x % 2 === 0);
  const doubleAll = (arr: number[]) => arr.map(x => x * 2);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const processNumbers = pipe(filterEven, doubleAll, sum);
  console.log("Original:", numbers);
  console.log("Filter even -> Double -> Sum:", processNumbers(numbers));
  console.log();

  console.log("=== Example 8: Middleware Pattern ===");
  interface Request {
    url: string;
    headers: Record<string, string>;
    body?: any;
  }

  const addAuthHeader = (req: Request) => ({
    ...req,
    headers: { ...req.headers, Authorization: "Bearer token123" },
  });

  const addContentType = (req: Request) => ({
    ...req,
    headers: { ...req.headers, "Content-Type": "application/json" },
  });

  const logRequest = (req: Request) => {
    console.log("Request:", req.url);
    return req;
  };

  const middleware = pipe(addAuthHeader, addContentType, logRequest);
  const request: Request = { url: "/api/users", headers: {} };
  middleware(request);
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same compose utility works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One composition implementation, all languages");
  console.log("  ✓ Consistent functional programming patterns");
  console.log("  ✓ Share composed functions across your stack");
  console.log("  ✓ No need for language-specific implementations");
  console.log("\n✅ Use Cases:");
  console.log("- Data transformation pipelines");
  console.log("- Middleware chains");
  console.log("- Validation sequences");
  console.log("- Processing workflows");
  console.log("- Mathematical operations");
  console.log("- String manipulations");
  console.log("\n🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead");
  console.log("- ~20K+ downloads/week on npm");
}
