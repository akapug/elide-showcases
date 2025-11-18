/**
 * Dot Prop Immutable - Immutable Dot Notation
 *
 * Immutable version of dot-prop with get/set/delete/merge using dot notation.
 * **POLYGLOT SHOWCASE**: One dot-prop lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dot-prop-immutable (~30K+ downloads/week)
 */

export const dotProp = {
  get: (obj: any, path: string): any => {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
    }
    return result;
  },

  set: (obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    
    function setRecursive(current: any, index: number): any {
      if (index === keys.length - 1) {
        if (Array.isArray(current)) {
          const result = [...current];
          result[keys[index] as any] = value;
          return result;
        }
        return { ...current, [keys[index]]: value };
      }

      const key = keys[index];
      const next = setRecursive(current[key] || {}, index + 1);
      
      if (Array.isArray(current)) {
        const result = [...current];
        result[key as any] = next;
        return result;
      }
      return { ...current, [key]: next };
    }

    return setRecursive(obj, 0);
  },

  delete: (obj: any, path: string): any => {
    const keys = path.split('.');
    
    function deleteRecursive(current: any, index: number): any {
      if (index === keys.length - 1) {
        const result = { ...current };
        delete result[keys[index]];
        return result;
      }

      const key = keys[index];
      return { ...current, [key]: deleteRecursive(current[key], index + 1) };
    }

    return deleteRecursive(obj, 0);
  },

  merge: (obj: any, path: string, value: any): any => {
    const current = dotProp.get(obj, path);
    const merged = { ...current, ...value };
    return dotProp.set(obj, path, merged);
  },
};

export default dotProp;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Dot Prop Immutable for Elide (POLYGLOT!)\n");

  const obj = { a: { b: { c: 1 } }, d: 2 };
  
  console.log("Original:", obj);
  console.log("get 'a.b.c':", dotProp.get(obj, 'a.b.c'));
  
  const updated = dotProp.set(obj, 'a.b.c', 10);
  console.log("set 'a.b.c' = 10:", updated);
  console.log("Original unchanged:", obj);
  
  const deleted = dotProp.delete(updated, 'd');
  console.log("delete 'd':", deleted);
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~30K+ downloads/week on npm");
}
