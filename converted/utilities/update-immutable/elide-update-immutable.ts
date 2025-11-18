/**
 * Update Immutable - Immutable Updates
 *
 * Simple immutable update helper.
 * **POLYGLOT SHOWCASE**: One update lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/update-immutable (~10K+ downloads/week)
 */

export function update<T>(obj: T, path: string | string[], value: any): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  
  function updateRecursive(current: any, index: number): any {
    if (index === keys.length) {
      return value;
    }

    const key = keys[index];
    const next = updateRecursive(current?.[key], index + 1);
    
    if (Array.isArray(current)) {
      const result = [...current];
      result[key as any] = next;
      return result;
    }
    
    return { ...(current || {}), [key]: next };
  }

  return updateRecursive(obj, 0);
}

export default update;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Update Immutable for Elide (POLYGLOT!)\n");

  const state = {
    users: [
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 }
    ]
  };

  console.log("Original:", state);
  
  const updated = update(state, ['users', 0, 'age'], 26);
  console.log("Update users[0].age = 26:", updated);
  console.log("Original unchanged:", state.users[0].age);

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~10K+ downloads/week on npm");
}
