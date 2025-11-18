/**
 * Immutability Helper - Immutable Updates
 *
 * Mutate a copy of data without changing original.
 * **POLYGLOT SHOWCASE**: One immutability helper for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/immutability-helper (~300K+ downloads/week)
 */

export function update<T>(obj: T, spec: any): T {
  if (typeof spec.$set !== 'undefined') {
    return spec.$set;
  }

  if (typeof spec.$merge !== 'undefined') {
    return { ...obj as any, ...spec.$merge };
  }

  if (typeof spec.$push !== 'undefined') {
    return [...(obj as any), ...spec.$push];
  }

  if (typeof spec.$splice !== 'undefined') {
    const result = [...(obj as any)];
    spec.$splice.forEach(([index, count, ...items]: any[]) => {
      result.splice(index, count, ...items);
    });
    return result as any;
  }

  if (typeof spec.$unset !== 'undefined') {
    const result = { ...(obj as any) };
    spec.$unset.forEach((key: string) => delete result[key]);
    return result;
  }

  const result: any = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in spec) {
    result[key] = update((obj as any)[key], spec[key]);
  }

  return result;
}

export default update;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔒 Immutability Helper for Elide (POLYGLOT!)\n");

  const state = { users: [{ name: "Alice", age: 25 }], count: 5 };
  
  console.log("Original:", state);
  const newState = update(state, {
    users: { 0: { age: { $set: 26 } } },
    count: { $set: 6 }
  });
  console.log("Updated:", newState);
  console.log("Original unchanged:", state);
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~300K+ downloads/week on npm");
}
