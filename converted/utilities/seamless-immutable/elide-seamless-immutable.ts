/**
 * Seamless Immutable - Immutable Data
 *
 * Immutable data structures for JavaScript.
 * **POLYGLOT SHOWCASE**: One immutable lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/seamless-immutable (~100K+ downloads/week)
 */

export function Immutable<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return Object.freeze(obj.map(Immutable)) as any;
  }

  const frozen: any = {};
  for (const key in obj) {
    frozen[key] = Immutable((obj as any)[key]);
  }
  return Object.freeze(frozen);
}

Immutable.merge = function<T extends object>(obj: T, ...sources: Partial<T>[]): T {
  return Immutable({ ...obj, ...Object.assign({}, ...sources) });
};

Immutable.set = function<T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return Immutable({ ...obj, [key]: value });
};

export default Immutable;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("❄️  Seamless Immutable for Elide (POLYGLOT!)\n");

  const obj = Immutable({ a: 1, b: { c: 2 } });
  console.log("Immutable object:", obj);
  
  try {
    (obj as any).a = 5;
  } catch (e) {
    console.log("Cannot mutate immutable object");
  }
  
  const updated = Immutable.set(obj, 'a', 5);
  console.log("Updated (new instance):", updated);
  console.log("Original unchanged:", obj);
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~100K+ downloads/week on npm");
}
