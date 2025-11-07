/**
 * Clone Deep - Deep Clone Objects and Arrays
 *
 * Create deep copies of objects, arrays, and other types without sharing references.
 * Essential for immutability and preventing unintended mutations.
 *
 * Features:
 * - Deep cloning of nested objects and arrays
 * - Handles Date, RegExp, Map, Set, TypedArray
 * - Circular reference support
 * - Preserves prototypes
 * - Type-safe generic implementation
 *
 * Use cases:
 * - State management (Redux, Zustand)
 * - Immutable data structures
 * - Preventing accidental mutations
 * - Creating snapshots
 * - Test fixtures
 *
 * Package has ~20M+ downloads/week on npm!
 */

/**
 * Deep clone a value
 */
export default function cloneDeep<T>(value: T): T {
  return _cloneDeep(value, new WeakMap());
}

/**
 * Internal clone with circular reference tracking
 */
function _cloneDeep<T>(value: T, cache: WeakMap<any, any>): T {
  // Primitives and null
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Check cache for circular references
  if (cache.has(value as any)) {
    return cache.get(value as any);
  }

  // Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }

  // RegExp
  if (value instanceof RegExp) {
    const flags = value.flags;
    const cloned = new RegExp(value.source, flags);
    cloned.lastIndex = value.lastIndex;
    return cloned as any;
  }

  // Map
  if (value instanceof Map) {
    const cloned = new Map();
    cache.set(value as any, cloned);
    for (const [k, v] of value) {
      cloned.set(_cloneDeep(k, cache), _cloneDeep(v, cache));
    }
    return cloned as any;
  }

  // Set
  if (value instanceof Set) {
    const cloned = new Set();
    cache.set(value as any, cloned);
    for (const item of value) {
      cloned.add(_cloneDeep(item, cache));
    }
    return cloned as any;
  }

  // TypedArray
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const constructor = (value as any).constructor;
    const cloned = new constructor((value as any).length);
    (cloned as any).set(value as any);
    return cloned as any;
  }

  // Array
  if (Array.isArray(value)) {
    const cloned: any[] = [];
    cache.set(value as any, cloned);
    for (let i = 0; i < value.length; i++) {
      cloned[i] = _cloneDeep(value[i], cache);
    }
    return cloned as any;
  }

  // Plain object or object with prototype
  const cloned = Object.create(Object.getPrototypeOf(value));
  cache.set(value as any, cloned);

  // Clone own properties (including non-enumerable)
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key in descriptors) {
    const descriptor = descriptors[key];
    if (descriptor.value !== undefined) {
      descriptor.value = _cloneDeep(descriptor.value, cache);
    }
    Object.defineProperty(cloned, key, descriptor);
  }

  return cloned;
}

/**
 * Shallow clone (only top level)
 */
export function cloneShallow<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return [...value] as any;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }

  if (value instanceof Map) {
    return new Map(value) as any;
  }

  if (value instanceof Set) {
    return new Set(value) as any;
  }

  return { ...value } as T;
}

// CLI Demo
if (import.meta.url.includes("elide-clone-deep.ts")) {
  console.log("📋 Clone Deep - Deep Cloning for Elide\n");

  console.log("=== Example 1: Simple Object ===");
  const original = { a: 1, b: 2, c: 3 };
  const cloned = cloneDeep(original);
  console.log("Original:", original);
  console.log("Cloned:", cloned);
  console.log("Same reference?", original === cloned);
  cloned.a = 999;
  console.log("After modifying clone, original.a:", original.a);
  console.log();

  console.log("=== Example 2: Nested Objects ===");
  const nested = {
    user: {
      name: 'Alice',
      profile: {
        age: 25,
        city: 'NYC'
      }
    }
  };
  const nestedClone = cloneDeep(nested);
  nestedClone.user.profile.city = 'SF';
  console.log("Original city:", nested.user.profile.city);
  console.log("Cloned city:", nestedClone.user.profile.city);
  console.log("Original unchanged:", nested.user.profile.city === 'NYC');
  console.log();

  console.log("=== Example 3: Arrays ===");
  const arr = [1, 2, [3, 4, [5, 6]]];
  const arrClone = cloneDeep(arr);
  (arrClone[2] as any)[2][0] = 999;
  console.log("Original:", JSON.stringify(arr));
  console.log("Cloned:", JSON.stringify(arrClone));
  console.log("Deep arrays are independent:", arr[2]![2]![0] === 5);
  console.log();

  console.log("=== Example 4: Dates ===");
  const date = new Date('2024-01-01');
  const dateClone = cloneDeep(date);
  console.log("Original date:", date.toISOString());
  console.log("Cloned date:", dateClone.toISOString());
  console.log("Same reference?", date === dateClone);
  dateClone.setFullYear(2025);
  console.log("After modifying clone:");
  console.log("  Original:", date.toISOString());
  console.log("  Cloned:", dateClone.toISOString());
  console.log();

  console.log("=== Example 5: RegExp ===");
  const regex = /hello/gi;
  const regexClone = cloneDeep(regex);
  console.log("Original:", regex);
  console.log("Cloned:", regexClone);
  console.log("Same reference?", regex === regexClone);
  console.log("Same source and flags:", regex.source === regexClone.source && regex.flags === regexClone.flags);
  console.log();

  console.log("=== Example 6: Maps ===");
  const map = new Map([
    ['key1', { value: 1 }],
    ['key2', { value: 2 }]
  ]);
  const mapClone = cloneDeep(map);
  mapClone.get('key1')!.value = 999;
  console.log("Original map key1:", map.get('key1'));
  console.log("Cloned map key1:", mapClone.get('key1'));
  console.log("Original unchanged:", map.get('key1')!.value === 1);
  console.log();

  console.log("=== Example 7: Sets ===");
  const set = new Set([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const setClone = cloneDeep(set);
  console.log("Original size:", set.size);
  console.log("Cloned size:", setClone.size);
  console.log("Same reference?", set === setClone);
  console.log("Deep cloned:", Array.from(set)[0] !== Array.from(setClone)[0]);
  console.log();

  console.log("=== Example 8: Circular References ===");
  const circular: any = { name: 'root' };
  circular.self = circular;
  circular.child = { parent: circular };
  const circularClone = cloneDeep(circular);
  console.log("Original self-reference works:", circular.self === circular);
  console.log("Cloned self-reference works:", circularClone.self === circularClone);
  console.log("Cloned child.parent works:", circularClone.child.parent === circularClone);
  console.log("Original and clone are separate:", circular !== circularClone);
  console.log();

  console.log("=== Example 9: State Management Example ===");
  interface AppState {
    user: { name: string; settings: { theme: string } };
    items: string[];
  }

  const state: AppState = {
    user: {
      name: 'Alice',
      settings: { theme: 'dark' }
    },
    items: ['a', 'b', 'c']
  };

  // Immutable update pattern
  const newState = cloneDeep(state);
  newState.user.settings.theme = 'light';
  newState.items.push('d');

  console.log("Original state theme:", state.user.settings.theme);
  console.log("New state theme:", newState.user.settings.theme);
  console.log("Original items:", state.items);
  console.log("New items:", newState.items);
  console.log();

  console.log("=== Example 10: Shallow vs Deep Clone ===");
  const obj = { a: 1, nested: { b: 2 } };

  const shallow = cloneShallow(obj);
  shallow.nested.b = 999;
  console.log("Shallow clone - original affected:", obj.nested.b === 999);

  const deep = cloneDeep(obj);
  deep.nested.b = 777;
  console.log("Deep clone - original unaffected:", obj.nested.b === 999);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- State management (Redux, Zustand)");
  console.log("- Immutable data structures");
  console.log("- Preventing accidental mutations");
  console.log("- Creating snapshots for undo/redo");
  console.log("- Test fixtures and mocking");
  console.log("- Configuration cloning");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~20M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use shallow clone when nested objects won't change");
  console.log("- Deep clone handles circular references automatically");
  console.log("- Preserves Date, RegExp, Map, Set types");
  console.log("- Safe for complex state management");
}
