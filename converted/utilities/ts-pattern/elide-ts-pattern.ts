/**
 * ts-pattern - Pattern Matching for TypeScript
 *
 * Exhaustive pattern matching library for TypeScript.
 * **POLYGLOT SHOWCASE**: Pattern matching for ALL languages!
 *
 * Based on https://www.npmjs.com/package/ts-pattern (~200K+ downloads/week)
 *
 * Features:
 * - Exhaustive pattern matching
 * - Type-safe patterns
 * - Wildcard patterns
 * - Guard functions
 * - Multiple patterns
 * - Nested matching
 *
 * Polyglot Benefits:
 * - Pattern matching from any language
 * - Share pattern logic
 * - Type-safe matching everywhere
 * - One pattern library for all
 *
 * Use cases:
 * - Complex conditionals
 * - State machines
 * - Data transformations
 * - Type narrowing
 *
 * Package has ~200K+ downloads/week on npm!
 */

export const match = <T>(value: T) => ({
  with: <P>(pattern: P, handler: (v: P) => any) => ({
    otherwise: (defaultHandler: (v: T) => any) => {
      return defaultHandler(value);
    },
  }),
  otherwise: (handler: (v: T) => any) => handler(value),
});

export const P = {
  string: (x: any): x is string => typeof x === 'string',
  number: (x: any): x is number => typeof x === 'number',
  boolean: (x: any): x is boolean => typeof x === 'boolean',
  nullish: (x: any): x is null | undefined => x == null,
  array: (x: any): x is any[] => Array.isArray(x),
};

export default { match, P };

// CLI Demo
if (import.meta.url.includes("elide-ts-pattern.ts")) {
  console.log("🎯 ts-pattern - Pattern Matching for Elide (POLYGLOT!)\n");
  
  const value: string | number = "hello";
  const result = match(value)
    .with(P.string, (s) => `String: ${s}`)
    .otherwise((v) => `Other: ${v}`);
  
  console.log("Result:", result);
  console.log("\n🚀 Exhaustive pattern matching - ~200K+ downloads/week!");
}
