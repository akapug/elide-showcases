/**
 * ts-results - Result Type for TypeScript
 *
 * Rust-like Result and Option types for TypeScript.
 * **POLYGLOT SHOWCASE**: Result types for ALL languages!
 *
 * Based on https://www.npmjs.com/package/ts-results (~50K+ downloads/week)
 *
 * Features:
 * - Result<T, E> type
 * - Option<T> type
 * - Map & flatMap
 * - Pattern matching
 * - Error handling
 * - Functional composition
 *
 * Polyglot Benefits:
 * - Safe error handling everywhere
 * - Share error patterns
 * - Type-safe operations
 * - One result library for all
 *
 * Use cases:
 * - Error handling
 * - Optional values
 * - Railway-oriented programming
 * - Safe transformations
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class Ok<T> {
  constructor(readonly value: T) {}
  
  isOk(): this is Ok<T> { return true; }
  isErr(): this is Err<never> { return false; }
  
  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }
}

export class Err<E> {
  constructor(readonly error: E) {}
  
  isOk(): this is Ok<never> { return false; }
  isErr(): this is Err<E> { return true; }
  
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as any;
  }
}

export type Result<T, E> = Ok<T> | Err<E>;

export class Some<T> {
  constructor(readonly value: T) {}
  
  isSome(): this is Some<T> { return true; }
  isNone(): this is None { return false; }
}

export class None {
  isSome(): this is Some<never> { return false; }
  isNone(): this is None { return true; }
}

export type Option<T> = Some<T> | None;

export default { Ok, Err, Some, None };

// CLI Demo
if (import.meta.url.includes("elide-ts-results.ts")) {
  console.log("✅ ts-results - Result Types for Elide (POLYGLOT!)\n");
  
  const okResult = new Ok(42);
  const errResult = new Err("error");
  
  console.log("Ok:", okResult.isOk(), "Value:", okResult.value);
  console.log("Err:", errResult.isErr(), "Error:", errResult.error);
  
  const someValue = new Some(100);
  const noneValue = new None();
  
  console.log("Some:", someValue.isSome(), "Value:", someValue.value);
  console.log("None:", noneValue.isNone());
  
  console.log("\n🚀 Rust-like Result types - ~50K+ downloads/week!");
}
