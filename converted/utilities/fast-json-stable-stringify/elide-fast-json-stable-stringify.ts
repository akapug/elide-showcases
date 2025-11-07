/**
 * Fast JSON Stable Stringify - Deterministic JSON Serialization
 *
 * Stringify JSON objects with sorted keys for deterministic output.
 * **POLYGLOT SHOWCASE**: One stable JSON for ALL languages on Elide!
 *
 * Features:
 * - Deterministic JSON serialization
 * - Sorted object keys
 * - Consistent output for hashing
 * - Custom replacer functions
 * - Pretty printing support
 * - Circular reference detection
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need stable JSON
 * - ONE implementation works everywhere on Elide
 * - Consistent JSON output across languages
 * - No need for language-specific serializers
 *
 * Use cases:
 * - Content hashing
 * - Cache keys
 * - Digital signatures
 * - Object comparison
 * - Data deduplication
 * - API consistency
 *
 * Package has ~1M+ downloads/week on npm!
 */

export interface StringifyOptions {
  /** Custom replacer function */
  replacer?: (key: string, value: any) => any;
  /** Indentation (spaces or string) */
  space?: string | number;
  /** Key sorting function */
  cmp?: (a: { key: string; value: any }, b: { key: string; value: any }) => number;
  /** Detect circular references */
  cycles?: boolean;
}

/**
 * Stable JSON stringify with sorted keys
 */
export default function stringify(obj: any, options: StringifyOptions = {}): string {
  const { replacer, space, cmp, cycles = false } = options;
  const indent = typeof space === 'number' ? ' '.repeat(space) : (space || '');
  const seen = cycles ? new Set() : null;

  return stringifyValue(obj, '', indent, 0, replacer, cmp, seen);
}

/**
 * Stringify a value
 */
function stringifyValue(
  value: any,
  key: string,
  indent: string,
  depth: number,
  replacer?: (key: string, value: any) => any,
  cmp?: (a: { key: string; value: any }, b: { key: string; value: any }) => number,
  seen?: Set<any> | null
): string {
  // Apply replacer
  if (replacer) {
    value = replacer(key, value);
  }

  // Handle primitives
  if (value === null) return 'null';
  if (value === undefined) return undefined as any; // Will be filtered out
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    return isFinite(value) ? String(value) : 'null';
  }
  if (typeof value === 'string') return JSON.stringify(value);

  // Check for circular references
  if (seen && typeof value === 'object') {
    if (seen.has(value)) {
      return cycles ? '"[Circular]"' : undefined as any;
    }
    seen.add(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const items = value.map((item, i) =>
      stringifyValue(item, String(i), indent, depth + 1, replacer, cmp, seen)
    ).filter(v => v !== undefined);

    if (items.length === 0) {
      if (seen) seen.delete(value);
      return '[]';
    }

    if (!indent) {
      const result = '[' + items.join(',') + ']';
      if (seen) seen.delete(value);
      return result;
    }

    const currentIndent = indent.repeat(depth);
    const nextIndent = indent.repeat(depth + 1);
    const result = '[\n' + items.map(item => nextIndent + item).join(',\n') + '\n' + currentIndent + ']';
    if (seen) seen.delete(value);
    return result;
  }

  // Handle objects
  if (typeof value === 'object') {
    const keys = Object.keys(value);

    if (keys.length === 0) {
      if (seen) seen.delete(value);
      return '{}';
    }

    // Sort keys
    let sortedKeys: string[];
    if (cmp) {
      const pairs = keys.map(k => ({ key: k, value: value[k] }));
      pairs.sort(cmp);
      sortedKeys = pairs.map(p => p.key);
    } else {
      sortedKeys = keys.sort();
    }

    const pairs = sortedKeys
      .map(k => {
        const v = stringifyValue(value[k], k, indent, depth + 1, replacer, cmp, seen);
        if (v === undefined) return undefined;
        return JSON.stringify(k) + ':' + (indent ? ' ' : '') + v;
      })
      .filter(p => p !== undefined);

    if (pairs.length === 0) {
      if (seen) seen.delete(value);
      return '{}';
    }

    if (!indent) {
      const result = '{' + pairs.join(',') + '}';
      if (seen) seen.delete(value);
      return result;
    }

    const currentIndent = indent.repeat(depth);
    const nextIndent = indent.repeat(depth + 1);
    const result = '{\n' + pairs.map(pair => nextIndent + pair).join(',\n') + '\n' + currentIndent + '}';
    if (seen) seen.delete(value);
    return result;
  }

  return String(value);
}

/**
 * Compare keys alphabetically (default)
 */
export function alphabetical(a: { key: string; value: any }, b: { key: string; value: any }): number {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}

/**
 * Compare keys reverse alphabetically
 */
export function reverseAlphabetical(a: { key: string; value: any }, b: { key: string; value: any }): number {
  return a.key > b.key ? -1 : a.key < b.key ? 1 : 0;
}

// Export as named function too
export { stringify };

// CLI Demo
if (import.meta.url.includes("elide-fast-json-stable-stringify.ts")) {
  console.log("🔒 Fast JSON Stable Stringify - Deterministic JSON for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Unstable vs Stable ===");
  const obj1 = { b: 2, a: 1, c: 3 };
  console.log("Object:", obj1);
  console.log("JSON.stringify:", JSON.stringify(obj1));
  console.log("Stable stringify:", stringify(obj1));
  console.log();

  console.log("=== Example 2: Nested Objects ===");
  const nested = {
    user: {
      name: "Alice",
      age: 25,
      address: {
        city: "NYC",
        state: "NY"
      }
    },
    active: true
  };
  console.log("Stable nested:");
  console.log(stringify(nested));
  console.log();

  console.log("=== Example 3: Pretty Print ===");
  const data = { z: 3, y: 2, x: 1 };
  console.log("Pretty printed:");
  console.log(stringify(data, { space: 2 }));
  console.log();

  console.log("=== Example 4: Consistent Hashing ===");
  const obj2 = { name: "Bob", age: 30, city: "SF" };
  const obj3 = { city: "SF", age: 30, name: "Bob" }; // Different order

  const str1 = stringify(obj2);
  const str2 = stringify(obj3);

  console.log("Object 1:", obj2);
  console.log("Object 2:", obj3, "(different order)");
  console.log("Stable string 1:", str1);
  console.log("Stable string 2:", str2);
  console.log("Identical:", str1 === str2 ? '✓' : '✗');
  console.log();

  console.log("=== Example 5: Arrays ===");
  const arr = [3, 1, 4, 1, 5, 9, 2, 6];
  console.log("Array:", arr);
  console.log("Stable:", stringify(arr));
  console.log();

  console.log("=== Example 6: Mixed Data ===");
  const mixed = {
    string: "hello",
    number: 42,
    boolean: true,
    null: null,
    array: [1, 2, 3],
    object: { a: 1, b: 2 }
  };
  console.log("Mixed data:");
  console.log(stringify(mixed, { space: 2 }));
  console.log();

  console.log("=== Example 7: Custom Replacer ===");
  const withSecrets = {
    username: "alice",
    password: "secret123",
    email: "alice@example.com"
  };

  const filtered = stringify(withSecrets, {
    replacer: (key, value) => key === 'password' ? '[REDACTED]' : value
  });

  console.log("Original has password");
  console.log("Filtered:", filtered);
  console.log();

  console.log("=== Example 8: Circular Reference Detection ===");
  const circular: any = { name: "root" };
  circular.self = circular;

  console.log("Circular object created");
  try {
    const result = stringify(circular, { cycles: true });
    console.log("With cycles=true:", result);
  } catch (e) {
    console.log("Error:", (e as Error).message);
  }
  console.log();

  console.log("=== Example 9: Custom Sort Order ===");
  const unsorted = { z: 1, a: 2, m: 3, b: 4 };

  console.log("Default (alphabetical):", stringify(unsorted));
  console.log("Reverse:", stringify(unsorted, { cmp: reverseAlphabetical }));
  console.log();

  console.log("=== Example 10: Cache Key Generation ===");
  const query1 = { page: 1, limit: 10, sort: "name" };
  const query2 = { sort: "name", page: 1, limit: 10 }; // Different order

  const key1 = stringify(query1);
  const key2 = stringify(query2);

  console.log("Query 1:", query1);
  console.log("Query 2:", query2, "(different order)");
  console.log("Cache key 1:", key1);
  console.log("Cache key 2:", key2);
  console.log("Same cache key:", key1 === key2 ? '✓' : '✗');
  console.log();

  console.log("=== Example 11: Special Values ===");
  const special = {
    infinity: Infinity,
    nan: NaN,
    undef: undefined,
    nil: null
  };
  console.log("Special values:", special);
  console.log("Stringified:", stringify(special));
  console.log("(Note: Infinity/NaN → null, undefined filtered out)");
  console.log();

  console.log("=== Example 12: POLYGLOT Use Case ===");
  console.log("🌐 Same stable JSON works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent JSON output everywhere");
  console.log("  ✓ No language-specific serialization bugs");
  console.log("  ✓ Share hashing logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Content hashing and signatures");
  console.log("- Cache key generation");
  console.log("- Object comparison");
  console.log("- Data deduplication");
  console.log("- API consistency");
  console.log("- Test assertions");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~1M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use for cache keys across services");
  console.log("- Share hashing logic across languages");
  console.log("- One JSON format for all systems");
  console.log("- Perfect for distributed systems!");
}
