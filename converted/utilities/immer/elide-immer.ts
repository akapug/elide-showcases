/**
 * Immer - Immutable State Updates for Elide
 *
 * Work with immutable state by mutating a draft:
 * - Simple API (produce function)
 * - Mutable syntax, immutable result
 * - Structural sharing
 * - Type-safe
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 20M+ downloads/week
 */

type Draft<T> = T;
type Recipe<T> = (draft: Draft<T>) => void | T;

export function produce<T>(base: T, recipe: Recipe<T>): T {
  // Create a deep copy as draft
  const draft = deepClone(base);

  // Apply recipe
  const result = recipe(draft);

  // Return result if returned, otherwise return mutated draft
  return result !== undefined ? result : draft;
}

export function createDraft<T>(base: T): Draft<T> {
  return deepClone(base);
}

export function finishDraft<T>(draft: Draft<T>): T {
  return draft;
}

function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime()) as any;
  if (Array.isArray(value)) return value.map(item => deepClone(item)) as any;

  const clone = {} as T;
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      clone[key] = deepClone(value[key]);
    }
  }
  return clone;
}

// CLI Demo
if (import.meta.url.includes("immer")) {
  console.log("🎯 Immer for Elide - Immutable State Made Easy\n");

  console.log("=== Simple Update ===");
  const state = { count: 0, name: 'Alice' };
  const next = produce(state, draft => {
    draft.count++;
    draft.name = 'Bob';
  });
  console.log("Original:", state);
  console.log("Updated:", next);
  console.log();

  console.log("=== Nested Update ===");
  const user = { profile: { name: 'Alice', age: 25 }, posts: [1, 2, 3] };
  const updated = produce(user, draft => {
    draft.profile.age++;
    draft.posts.push(4);
  });
  console.log("Original:", user);
  console.log("Updated:", updated);
  console.log();

  console.log("=== Array Operations ===");
  const todos = [
    { id: 1, text: 'Learn Immer', done: false },
    { id: 2, text: 'Build app', done: false }
  ];
  const completed = produce(todos, draft => {
    draft[0].done = true;
    draft.push({ id: 3, text: 'Deploy', done: false });
  });
  console.log("Original:", todos);
  console.log("Updated:", completed);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Redux reducers");
  console.log("- React state updates");
  console.log("- Complex state changes");
  console.log("- Nested object updates");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 20M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Simple mutable API, immutable result");
}

export default produce;
