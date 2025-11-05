/**
 * Merge Deep - Deep Merge Objects and Arrays
 *
 * Recursively merge properties of objects and arrays without mutating inputs.
 * Essential for configuration management, options merging, and state updates.
 *
 * Features:
 * - Deep merging of nested objects
 * - Array merge strategies (replace, concat, unique)
 * - Does not mutate input objects
 * - Handles null and undefined
 * - Custom merge functions
 *
 * Use cases:
 * - Configuration merging (defaults + user config)
 * - Options object merging
 * - State updates in reducers
 * - Plugin configuration
 * - API response merging
 *
 * Package has ~10M+ downloads/week on npm!
 */

type ArrayMergeStrategy = 'replace' | 'concat' | 'unique';

interface MergeOptions {
  /** How to merge arrays (default: 'replace') */
  arrayMerge?: ArrayMergeStrategy;
  /** Custom merge function for specific keys */
  customMerge?: (key: string) => ((a: any, b: any) => any) | undefined;
}

/**
 * Deep merge multiple objects
 */
export default function mergeDeep<T = any>(...objects: any[]): T {
  return _mergeDeep(objects, {});
}

/**
 * Deep merge with options
 */
export function mergeDeepWith<T = any>(
  options: MergeOptions,
  ...objects: any[]
): T {
  return _mergeDeep(objects, options);
}

/**
 * Internal merge implementation
 */
function _mergeDeep(objects: any[], options: MergeOptions): any {
  const { arrayMerge = 'replace', customMerge } = options;

  // Filter out null and undefined
  const validObjects = objects.filter(obj => obj != null);

  if (validObjects.length === 0) {
    return {};
  }

  if (validObjects.length === 1) {
    return cloneValue(validObjects[0]);
  }

  const result: any = {};

  for (const obj of validObjects) {
    if (typeof obj !== 'object' || obj === null) {
      continue;
    }

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) {
        continue;
      }

      const value = obj[key];

      // Check for custom merge function
      if (customMerge) {
        const customFn = customMerge(key);
        if (customFn) {
          result[key] = customFn(result[key], value);
          continue;
        }
      }

      // If key doesn't exist in result yet, just clone the value
      if (!(key in result)) {
        result[key] = cloneValue(value);
        continue;
      }

      const existing = result[key];

      // Both are arrays
      if (Array.isArray(existing) && Array.isArray(value)) {
        result[key] = mergeArrays(existing, value, arrayMerge);
        continue;
      }

      // Both are plain objects
      if (isPlainObject(existing) && isPlainObject(value)) {
        result[key] = _mergeDeep([existing, value], options);
        continue;
      }

      // Otherwise, replace
      result[key] = cloneValue(value);
    }
  }

  return result;
}

/**
 * Merge arrays based on strategy
 */
function mergeArrays(
  a: any[],
  b: any[],
  strategy: ArrayMergeStrategy
): any[] {
  if (strategy === 'replace') {
    return [...b];
  }

  if (strategy === 'concat') {
    return [...a, ...b];
  }

  if (strategy === 'unique') {
    const combined = [...a, ...b];
    return Array.from(new Set(combined.map(item => JSON.stringify(item))))
      .map(str => JSON.parse(str));
  }

  return [...b];
}

/**
 * Clone a value (shallow for primitives, deep for objects)
 */
function cloneValue(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => cloneValue(item));
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  const cloned: any = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      cloned[key] = cloneValue(value[key]);
    }
  }
  return cloned;
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// CLI Demo
if (import.meta.url.includes("elide-merge-deep.ts")) {
  console.log("🔀 Merge Deep - Deep Object Merging for Elide\n");

  console.log("=== Example 1: Basic Merge ===");
  const obj1 = { a: 1, b: 2 };
  const obj2 = { b: 3, c: 4 };
  const merged1 = mergeDeep(obj1, obj2);
  console.log("obj1:", obj1);
  console.log("obj2:", obj2);
  console.log("merged:", merged1);
  console.log();

  console.log("=== Example 2: Nested Objects ===");
  const config1 = {
    server: { port: 3000, host: 'localhost' },
    database: { name: 'mydb' }
  };
  const config2 = {
    server: { port: 4000 },
    database: { user: 'admin', pass: 'secret' }
  };
  const merged2 = mergeDeep(config1, config2);
  console.log("Config 1:", JSON.stringify(config1, null, 2));
  console.log("Config 2:", JSON.stringify(config2, null, 2));
  console.log("Merged:", JSON.stringify(merged2, null, 2));
  console.log();

  console.log("=== Example 3: Multiple Objects ===");
  const defaults = { a: 1, b: 2, c: 3 };
  const user = { b: 20, d: 4 };
  const override = { c: 30, e: 5 };
  const merged3 = mergeDeep(defaults, user, override);
  console.log("Merged:", merged3);
  console.log();

  console.log("=== Example 4: Array Strategies ===");
  const arr1 = { items: ['a', 'b'] };
  const arr2 = { items: ['c', 'd'] };

  console.log("Original arrays:");
  console.log("  arr1:", arr1);
  console.log("  arr2:", arr2);

  console.log("\nReplace strategy (default):");
  console.log("  ", mergeDeep(arr1, arr2));

  console.log("\nConcat strategy:");
  console.log("  ", mergeDeepWith({ arrayMerge: 'concat' }, arr1, arr2));

  console.log("\nUnique strategy:");
  const arr3 = { items: ['a', 'b'] };
  const arr4 = { items: ['b', 'c'] };
  console.log("  ", mergeDeepWith({ arrayMerge: 'unique' }, arr3, arr4));
  console.log();

  console.log("=== Example 5: Configuration Merging ===");
  const defaultConfig = {
    app: {
      name: 'MyApp',
      version: '1.0.0',
      features: {
        auth: true,
        api: true,
        cache: false
      }
    },
    server: {
      port: 3000,
      timeout: 30000
    }
  };

  const userConfig = {
    app: {
      features: {
        cache: true,
        logging: true
      }
    },
    server: {
      port: 8080
    }
  };

  const finalConfig = mergeDeep(defaultConfig, userConfig);
  console.log("Final config:");
  console.log(JSON.stringify(finalConfig, null, 2));
  console.log();

  console.log("=== Example 6: No Mutation ===");
  const original = { a: 1, nested: { b: 2 } };
  const addition = { nested: { c: 3 } };
  const result = mergeDeep(original, addition);
  console.log("Original:", JSON.stringify(original));
  console.log("Addition:", JSON.stringify(addition));
  console.log("Result:", JSON.stringify(result));
  console.log("Original unchanged:", JSON.stringify(original) === '{"a":1,"nested":{"b":2}}');
  console.log();

  console.log("=== Example 7: Custom Merge Function ===");
  const data1 = { count: 5, tags: ['a', 'b'] };
  const data2 = { count: 3, tags: ['c'] };

  const customMerged = mergeDeepWith({
    customMerge: (key: string) => {
      if (key === 'count') {
        return (a: number, b: number) => (a || 0) + b; // Sum counts
      }
      if (key === 'tags') {
        return (a: string[], b: string[]) => [...new Set([...(a || []), ...(b || [])])]; // Unique tags
      }
      return undefined;
    }
  }, data1, data2);

  console.log("data1:", data1);
  console.log("data2:", data2);
  console.log("Custom merged (count summed, tags unique):", customMerged);
  console.log();

  console.log("=== Example 8: Handling Null/Undefined ===");
  const withNull = { a: 1, b: null };
  const withUndefined = { b: 2, c: undefined };
  const nullMerged = mergeDeep(withNull, withUndefined);
  console.log("withNull:", withNull);
  console.log("withUndefined:", withUndefined);
  console.log("merged:", nullMerged);
  console.log();

  console.log("=== Example 9: Deep State Update ===");
  const currentState = {
    user: {
      profile: { name: 'Alice', age: 25 },
      preferences: { theme: 'dark', notifications: true }
    },
    session: { token: 'abc123' }
  };

  const stateUpdate = {
    user: {
      preferences: { theme: 'light' }
    },
    session: { lastActive: Date.now() }
  };

  const newState = mergeDeep(currentState, stateUpdate);
  console.log("New state preserves all fields:");
  console.log("  Name:", newState.user.profile.name);
  console.log("  Age:", newState.user.profile.age);
  console.log("  Theme:", newState.user.preferences.theme);
  console.log("  Notifications:", newState.user.preferences.notifications);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Configuration merging (defaults + user)");
  console.log("- Options object merging");
  console.log("- State updates in reducers");
  console.log("- Plugin configuration");
  console.log("- API response merging");
  console.log("- Theme and settings management");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~10M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use 'replace' for simple array overwriting");
  console.log("- Use 'concat' to combine arrays");
  console.log("- Use 'unique' to deduplicate merged arrays");
  console.log("- Custom merge for special key handling");
}
