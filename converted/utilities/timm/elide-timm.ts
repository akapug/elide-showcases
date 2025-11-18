/**
 * Timm - Immutability Library
 *
 * Tiny immutable operations library.
 * **POLYGLOT SHOWCASE**: One immutability lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/timm (~50K+ downloads/week)
 */

export const timm = {
  set: <T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T => {
    if (obj[key] === value) return obj;
    return { ...obj, [key]: value };
  },

  merge: <T extends object>(obj: T, ...sources: Partial<T>[]): T => {
    let changed = false;
    const result = { ...obj };
    
    for (const source of sources) {
      for (const key in source) {
        if (result[key] !== source[key]) {
          (result as any)[key] = source[key];
          changed = true;
        }
      }
    }
    
    return changed ? result : obj;
  },

  setIn: (obj: any, path: (string | number)[], value: any): any => {
    if (path.length === 0) return value;
    
    const [key, ...rest] = path;
    const nextValue = rest.length === 0 ? value : timm.setIn(obj[key], rest, value);
    
    if (Array.isArray(obj)) {
      const result = [...obj];
      result[key as number] = nextValue;
      return result;
    }
    
    return { ...obj, [key]: nextValue };
  },

  addLast: <T>(array: T[], item: T): T[] => [...array, item],
  
  addFirst: <T>(array: T[], item: T): T[] => [item, ...array],
  
  removeAt: <T>(array: T[], index: number): T[] => {
    return [...array.slice(0, index), ...array.slice(index + 1)];
  },
};

export default timm;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  Timm - Immutability for Elide (POLYGLOT!)\n");

  const obj = { a: 1, b: 2 };
  console.log("Original:", obj);
  console.log("set:", timm.set(obj, 'a', 5));
  console.log("merge:", timm.merge(obj, { c: 3 }));
  
  const arr = [1, 2, 3];
  console.log("\nArray:", arr);
  console.log("addLast:", timm.addLast(arr, 4));
  console.log("removeAt(1):", timm.removeAt(arr, 1));
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~50K+ downloads/week on npm");
}
