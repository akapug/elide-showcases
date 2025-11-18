/**
 * Deep Object Diff - Detailed Object Differences
 *
 * Find detailed differences between objects.
 * **POLYGLOT SHOWCASE**: One object diff for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/deep-object-diff (~300K+ downloads/week)
 *
 * Features:
 * - Detailed object comparison
 * - Added/deleted/updated tracking
 * - Nested object support
 * - Simple API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need object comparison
 * - ONE implementation works everywhere on Elide
 * - Consistent diff output across languages
 * - Share comparison logic across your stack
 *
 * Use cases:
 * - State management (track changes)
 * - Form validation (what changed)
 * - API updates (delta detection)
 * - Data synchronization
 *
 * Package has ~300K+ downloads/week on npm!
 */

export function diff(lhs: any, rhs: any): any {
  if (lhs === rhs) return {};
  if (!isObject(lhs) || !isObject(rhs)) return rhs;

  const deletedValues = Object.keys(lhs).reduce((acc, key) => {
    if (!rhs.hasOwnProperty(key)) {
      acc[key] = undefined;
    }
    return acc;
  }, {} as any);

  return Object.keys(rhs).reduce((acc, key) => {
    if (!lhs.hasOwnProperty(key)) {
      acc[key] = rhs[key];
      return acc;
    }

    const difference = diff(lhs[key], rhs[key]);

    if (isObject(difference) && Object.keys(difference).length === 0) {
      return acc;
    }

    acc[key] = difference;
    return acc;
  }, deletedValues);
}

export function addedDiff(lhs: any, rhs: any): any {
  if (lhs === rhs || !isObject(lhs) || !isObject(rhs)) return {};

  return Object.keys(rhs).reduce((acc, key) => {
    if (!lhs.hasOwnProperty(key)) {
      acc[key] = rhs[key];
      return acc;
    }

    const difference = addedDiff(lhs[key], rhs[key]);

    if (isObject(difference) && Object.keys(difference).length > 0) {
      acc[key] = difference;
    }

    return acc;
  }, {} as any);
}

export function deletedDiff(lhs: any, rhs: any): any {
  if (lhs === rhs || !isObject(lhs) || !isObject(rhs)) return {};

  return Object.keys(lhs).reduce((acc, key) => {
    if (!rhs.hasOwnProperty(key)) {
      acc[key] = undefined;
      return acc;
    }

    const difference = deletedDiff(lhs[key], rhs[key]);

    if (isObject(difference) && Object.keys(difference).length > 0) {
      acc[key] = difference;
    }

    return acc;
  }, {} as any);
}

export function updatedDiff(lhs: any, rhs: any): any {
  if (lhs === rhs) return {};
  if (!isObject(lhs) || !isObject(rhs)) return rhs;

  return Object.keys(rhs).reduce((acc, key) => {
    if (!lhs.hasOwnProperty(key)) return acc;

    const difference = updatedDiff(lhs[key], rhs[key]);

    if (isObject(difference) && Object.keys(difference).length > 0) {
      acc[key] = difference;
    } else if (lhs[key] !== rhs[key]) {
      acc[key] = rhs[key];
    }

    return acc;
  }, {} as any);
}

export function detailedDiff(lhs: any, rhs: any) {
  return {
    added: addedDiff(lhs, rhs),
    deleted: deletedDiff(lhs, rhs),
    updated: updatedDiff(lhs, rhs)
  };
}

function isObject(obj: any): boolean {
  return obj != null && typeof obj === 'object' && !Array.isArray(obj);
}

export default { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff };

// CLI Demo
if (import.meta.url.includes("elide-deep-object-diff.ts")) {
  console.log("🔎 Deep Object Diff - Object Differences for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Diff ===");
  const obj1 = { a: 1, b: 2, c: 3 };
  const obj2 = { a: 1, b: 4, d: 5 };
  console.log("Object 1:", obj1);
  console.log("Object 2:", obj2);
  console.log("Diff:", diff(obj1, obj2));
  console.log();

  console.log("=== Example 2: Detailed Diff ===");
  const detailed = detailedDiff(obj1, obj2);
  console.log("Added:", detailed.added);
  console.log("Deleted:", detailed.deleted);
  console.log("Updated:", detailed.updated);
  console.log();

  console.log("=== Example 3: Nested Objects ===");
  const nested1 = { user: { name: "Alice", age: 30 }, active: true };
  const nested2 = { user: { name: "Alice", age: 31 }, active: true, role: "admin" };
  console.log("Nested diff:", diff(nested1, nested2));
  console.log();

  console.log("=== Example 4: POLYGLOT Use Case ===");
  console.log("🌐 Same deep-object-diff works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- State management");
  console.log("- Form validation");
  console.log("- API delta detection");
  console.log("- Data synchronization");
  console.log("- ~300K+ downloads/week on npm");
}
