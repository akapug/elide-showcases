/**
 * Just Diff - Minimal Object Diffing
 *
 * A minimal, fast object diffing library.
 * **POLYGLOT SHOWCASE**: One minimal diff for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-diff (~100K+ downloads/week)
 *
 * Features:
 * - Tiny size (minimal code)
 * - Fast diffing algorithm
 * - JSON Pointer paths
 * - Array/object support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need minimal diffing
 * - ONE implementation works everywhere on Elide
 * - Consistent paths across languages
 * - Share minimal diff logic
 *
 * Use cases:
 * - Simple state diffs
 * - Lightweight change tracking
 * - JSON document diffing
 * - Minimal footprint apps
 *
 * Package has ~100K+ downloads/week on npm!
 */

export type Operation = 'add' | 'remove' | 'replace';

export interface DiffOp {
  op: Operation;
  path: (string | number)[];
  value?: any;
}

export function diff(obj1: any, obj2: any, path: (string | number)[] = []): DiffOp[] {
  const diffs: DiffOp[] = [];

  if (obj1 === obj2) return diffs;

  const type1 = Array.isArray(obj1) ? 'array' : typeof obj1;
  const type2 = Array.isArray(obj2) ? 'array' : typeof obj2;

  if (type1 !== type2 || type1 !== 'object' && type1 !== 'array') {
    if (obj1 !== undefined && obj2 !== undefined) {
      diffs.push({ op: 'replace', path, value: obj2 });
    } else if (obj2 !== undefined) {
      diffs.push({ op: 'add', path, value: obj2 });
    } else {
      diffs.push({ op: 'remove', path });
    }
    return diffs;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const len = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < len; i++) {
      diffs.push(...diff(obj1[i], obj2[i], [...path, i]));
    }
  } else {
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of keys) {
      diffs.push(...diff(obj1?.[key], obj2?.[key], [...path, key]));
    }
  }

  return diffs;
}

export default diff;

// CLI Demo
if (import.meta.url.includes("elide-just-diff.ts")) {
  console.log("⚡ Just Diff - Minimal Diffing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Simple Changes ===");
  const obj1 = { a: 1, b: 2 };
  const obj2 = { a: 1, b: 3, c: 4 };
  const diffs = diff(obj1, obj2);
  console.log("Object 1:", obj1);
  console.log("Object 2:", obj2);
  console.log("Diffs:", diffs);
  console.log();

  console.log("=== Example 2: Array Changes ===");
  const arr1 = [1, 2, 3];
  const arr2 = [1, 3, 4];
  const arrDiffs = diff(arr1, arr2);
  console.log("Array 1:", arr1);
  console.log("Array 2:", arr2);
  console.log("Diffs:", arrDiffs);
  console.log();

  console.log("=== Example 3: POLYGLOT Use Case ===");
  console.log("🌐 Same just-diff works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Simple state diffs");
  console.log("- Lightweight change tracking");
  console.log("- JSON document diffing");
  console.log("- ~100K+ downloads/week on npm");
}
