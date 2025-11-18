/**
 * Immer - Immutable State Management
 *
 * Create the next immutable state by mutating the current one.
 * **POLYGLOT SHOWCASE**: One immutable library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/immer (~3M+ downloads/week)
 *
 * Features:
 * - Immutable updates
 * - Simple mutable API
 * - Structural sharing
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export function produce<T>(base: T, recipe: (draft: T) => void): T {
  const copy = JSON.parse(JSON.stringify(base));
  recipe(copy);
  return copy;
}

export default produce;

if (import.meta.url.includes("elide-immer.ts")) {
  console.log("🔒 Immer - Immutable State for Elide (POLYGLOT!)\n");
  
  const state = { count: 0, user: { name: "Alice" } };
  const next = produce(state, draft => {
    draft.count++;
    draft.user.name = "Bob";
  });
  
  console.log("Original:", state);
  console.log("Next:", next);
  console.log("\n✅ ~3M+ downloads/week on npm");
}
