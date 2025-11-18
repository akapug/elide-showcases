/**
 * Deep Diff - Deep Object Diffing
 *
 * Deep diff between two objects with detailed change tracking.
 * **POLYGLOT SHOWCASE**: One deep diff for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/deep-diff (~500K+ downloads/week)
 *
 * Features:
 * - Deep object comparison
 * - Track edits, adds, deletes
 * - Array change detection
 * - Path tracking for changes
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need object diffing
 * - ONE implementation works everywhere on Elide
 * - Consistent diff format across languages
 * - Share state diffing logic across your stack
 *
 * Use cases:
 * - State management
 * - Change tracking
 * - Audit logs
 * - Data synchronization
 *
 * Package has ~500K+ downloads/week on npm!
 */

export type DiffKind = 'N' | 'D' | 'E' | 'A';

export interface Diff {
  kind: DiffKind;
  path: (string | number)[];
  lhs?: any;
  rhs?: any;
  index?: number;
  item?: Diff;
}

/**
 * Deep diff between two objects
 */
export function diff(lhs: any, rhs: any, path: (string | number)[] = []): Diff[] | undefined {
  const changes: Diff[] = [];

  // Both null/undefined
  if (lhs === rhs) return undefined;

  // Type changed
  const lhsType = typeof lhs;
  const rhsType = typeof rhs;

  // New value (rhs exists, lhs doesn't)
  if (lhsType === 'undefined') {
    changes.push({ kind: 'N', path, rhs });
    return changes;
  }

  // Deleted value (lhs exists, rhs doesn't)
  if (rhsType === 'undefined') {
    changes.push({ kind: 'D', path, lhs });
    return changes;
  }

  // Different types
  if (lhsType !== rhsType) {
    changes.push({ kind: 'E', path, lhs, rhs });
    return changes;
  }

  // Arrays
  if (Array.isArray(lhs) && Array.isArray(rhs)) {
    const arrayChanges = diffArrays(lhs, rhs, path);
    if (arrayChanges.length) changes.push(...arrayChanges);
  }
  // Objects
  else if (lhsType === 'object' && lhs !== null && rhs !== null) {
    const objectChanges = diffObjects(lhs, rhs, path);
    if (objectChanges.length) changes.push(...objectChanges);
  }
  // Primitives
  else if (lhs !== rhs) {
    changes.push({ kind: 'E', path, lhs, rhs });
  }

  return changes.length ? changes : undefined;
}

/**
 * Diff two objects
 */
function diffObjects(lhs: any, rhs: any, path: (string | number)[]): Diff[] {
  const changes: Diff[] = [];
  const keys = new Set([...Object.keys(lhs), ...Object.keys(rhs)]);

  for (const key of keys) {
    const nested = diff(lhs[key], rhs[key], [...path, key]);
    if (nested) changes.push(...nested);
  }

  return changes;
}

/**
 * Diff two arrays
 */
function diffArrays(lhs: any[], rhs: any[], path: (string | number)[]): Diff[] {
  const changes: Diff[] = [];
  const maxLen = Math.max(lhs.length, rhs.length);

  for (let i = 0; i < maxLen; i++) {
    if (i >= lhs.length) {
      changes.push({
        kind: 'A',
        path,
        index: i,
        item: { kind: 'N', path: [...path, i], rhs: rhs[i] }
      });
    } else if (i >= rhs.length) {
      changes.push({
        kind: 'A',
        path,
        index: i,
        item: { kind: 'D', path: [...path, i], lhs: lhs[i] }
      });
    } else {
      const nested = diff(lhs[i], rhs[i], [...path, i]);
      if (nested) {
        for (const change of nested) {
          changes.push({
            kind: 'A',
            path,
            index: i,
            item: change
          });
        }
      }
    }
  }

  return changes;
}

/**
 * Apply changes to an object
 */
export function applyChange(target: any, source: any, change: Diff): void {
  if (!change || !change.path) return;

  const path = change.path;
  let obj = target;

  // Navigate to parent
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof obj[path[i]] === 'undefined') {
      obj[path[i]] = typeof path[i + 1] === 'number' ? [] : {};
    }
    obj = obj[path[i]];
  }

  const lastKey = path[path.length - 1];

  switch (change.kind) {
    case 'N': // New
      obj[lastKey] = change.rhs;
      break;
    case 'D': // Deleted
      delete obj[lastKey];
      break;
    case 'E': // Edited
      obj[lastKey] = change.rhs;
      break;
    case 'A': // Array
      if (change.item) {
        applyChange(obj[lastKey], null, change.item);
      }
      break;
  }
}

/**
 * Revert a change
 */
export function revertChange(target: any, source: any, change: Diff): void {
  if (!change || !change.path) return;

  const path = change.path;
  let obj = target;

  for (let i = 0; i < path.length - 1; i++) {
    obj = obj[path[i]];
  }

  const lastKey = path[path.length - 1];

  switch (change.kind) {
    case 'N': // New -> Delete
      delete obj[lastKey];
      break;
    case 'D': // Deleted -> Restore
      obj[lastKey] = change.lhs;
      break;
    case 'E': // Edited -> Revert
      obj[lastKey] = change.lhs;
      break;
    case 'A': // Array
      if (change.item) {
        revertChange(obj[lastKey], null, change.item);
      }
      break;
  }
}

export default diff;

// CLI Demo
if (import.meta.url.includes("elide-deep-diff.ts")) {
  console.log("🔍 Deep Diff - Deep Object Diffing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Simple Object Diff ===");
  const obj1 = { name: "Alice", age: 30 };
  const obj2 = { name: "Alice", age: 31 };
  const changes1 = diff(obj1, obj2);
  console.log("Object 1:", obj1);
  console.log("Object 2:", obj2);
  console.log("Changes:", changes1);
  console.log();

  console.log("=== Example 2: Nested Objects ===");
  const nested1 = {
    user: { name: "Bob", settings: { theme: "dark" } }
  };
  const nested2 = {
    user: { name: "Bob", settings: { theme: "light", lang: "en" } }
  };
  const changes2 = diff(nested1, nested2);
  console.log("Nested 1:", JSON.stringify(nested1));
  console.log("Nested 2:", JSON.stringify(nested2));
  console.log("Changes:");
  changes2?.forEach(c => {
    console.log(`  ${c.kind} at ${c.path.join('.')}: ${c.lhs} -> ${c.rhs}`);
  });
  console.log();

  console.log("=== Example 3: Array Changes ===");
  const arr1 = { items: [1, 2, 3] };
  const arr2 = { items: [1, 2, 4] };
  const changes3 = diff(arr1, arr2);
  console.log("Array 1:", arr1);
  console.log("Array 2:", arr2);
  console.log("Changes:", changes3);
  console.log();

  console.log("=== Example 4: Apply Changes ===");
  const original = { name: "Charlie", age: 25 };
  const modified = { name: "Charlie", age: 26, city: "NYC" };
  const changes4 = diff(original, modified);
  console.log("Original:", original);
  console.log("Modified:", modified);
  console.log("Changes:", changes4);

  const target = { name: "Charlie", age: 25 };
  changes4?.forEach(change => applyChange(target, null, change));
  console.log("After applying:", target);
  console.log();

  console.log("=== Example 5: Revert Changes ===");
  const reverted = { name: "Charlie", age: 26, city: "NYC" };
  changes4?.forEach(change => revertChange(reverted, null, change));
  console.log("After reverting:", reverted);
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same deep-diff works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One diff library, all languages");
  console.log("  ✓ Track state changes anywhere");
  console.log("  ✓ Perfect for audit logs");
  console.log("  ✓ ~500K+ downloads/week on npm");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- State management");
  console.log("- Change tracking");
  console.log("- Audit logs");
  console.log("- Data synchronization");
}
