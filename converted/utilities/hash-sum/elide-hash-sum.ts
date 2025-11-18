/**
 * hash-sum - Create Hash Checksums
 *
 * Create simple hash checksums for objects, strings, and data.
 * Useful for cache keys, object comparison, and checksums.
 *
 * Features:
 * - Hash any JavaScript value
 * - Deterministic output
 * - Object property order independent
 * - Fast performance
 *
 * Package has ~8M+ downloads/week on npm!
 */

async function hashSum(value: any): Promise<string> {
  const str = serialize(value);
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function serialize(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  if (type === 'string') return `"${value}"`;
  if (type === 'number') return value.toString();
  if (type === 'boolean') return value.toString();

  if (Array.isArray(value)) {
    return '[' + value.map(serialize).join(',') + ']';
  }

  if (type === 'object') {
    const keys = Object.keys(value).sort();
    const pairs = keys.map(k => `"${k}":${serialize(value[k])}`);
    return '{' + pairs.join(',') + '}';
  }

  return String(value);
}

export default hashSum;
export { hashSum };

if (import.meta.url.includes("elide-hash-sum.ts")) {
  console.log("🔐 hash-sum - Create Hash Checksums\n");

  console.log("=== Example 1: Hash Strings ===");
  console.log("Hash of 'hello':", await hashSum('hello'));
  console.log("Hash of 'world':", await hashSum('world'));
  console.log();

  console.log("=== Example 2: Hash Objects ===");
  const obj1 = { name: 'Alice', age: 30 };
  const obj2 = { age: 30, name: 'Alice' }; // Different order

  console.log("Object 1:", await hashSum(obj1));
  console.log("Object 2:", await hashSum(obj2));
  console.log("Same hash:", await hashSum(obj1) === await hashSum(obj2) ? 'Yes ✓' : 'No');
  console.log();

  console.log("=== Example 3: Cache Keys ===");
  async function getCacheKey(params: any): Promise<string> {
    return await hashSum(params);
  }

  const key1 = await getCacheKey({ userId: 123, page: 1 });
  const key2 = await getCacheKey({ page: 1, userId: 123 });

  console.log("Cache key 1:", key1.substring(0, 16), "...");
  console.log("Cache key 2:", key2.substring(0, 16), "...");
  console.log("Same key:", key1 === key2 ? 'Yes ✓' : 'No');
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Cache keys");
  console.log("- Object comparison");
  console.log("- Checksums");
  console.log();

  console.log("🚀 ~8M+ downloads/week on npm");
}
