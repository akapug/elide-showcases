/**
 * Node Diff3 - Three-Way Merge Algorithm
 *
 * Perform 3-way merge of text files.
 * **POLYGLOT SHOWCASE**: One 3-way merge for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/node-diff3 (~50K+ downloads/week)
 *
 * Features:
 * - 3-way merge algorithm
 * - Conflict detection
 * - Common ancestor support
 * - Used in version control
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need 3-way merging
 * - ONE implementation works everywhere on Elide
 * - Consistent merge logic across languages
 * - Share VCS logic across your stack
 *
 * Use cases:
 * - Version control systems
 * - Collaborative editing
 * - Merge conflict resolution
 * - File synchronization
 *
 * Package has ~50K+ downloads/week on npm!
 */

export interface MergeResult {
  conflict: boolean;
  result: string[];
  conflicts: Conflict[];
}

export interface Conflict {
  a: string[];
  o: string[];
  b: string[];
}

/**
 * Perform 3-way merge
 */
export function merge3(a: string[], o: string[], b: string[]): MergeResult {
  const result: string[] = [];
  const conflicts: Conflict[] = [];
  let conflict = false;

  let i = 0, j = 0, k = 0;

  while (i < a.length || j < o.length || k < b.length) {
    // All three match
    if (i < a.length && j < o.length && k < b.length &&
        a[i] === o[j] && o[j] === b[k]) {
      result.push(a[i]);
      i++; j++; k++;
      continue;
    }

    // Find next common point
    const nextCommon = findNextCommon(a, o, b, i, j, k);

    if (nextCommon) {
      const { ai, oi, bi } = nextCommon;

      // Check if both sides made the same change
      const aChange = a.slice(i, ai);
      const bChange = b.slice(k, bi);
      const oChange = o.slice(j, oi);

      if (arraysEqual(aChange, bChange)) {
        // Same change on both sides
        result.push(...aChange);
      } else if (aChange.length === 0) {
        // Only B changed
        result.push(...bChange);
      } else if (bChange.length === 0) {
        // Only A changed
        result.push(...aChange);
      } else {
        // Conflict
        conflict = true;
        conflicts.push({
          a: aChange,
          o: oChange,
          b: bChange
        });
        result.push('<<<<<<<');
        result.push(...aChange);
        result.push('=======');
        result.push(...bChange);
        result.push('>>>>>>>');
      }

      i = ai; j = oi; k = bi;
    } else {
      // No more common points
      const aRest = a.slice(i);
      const bRest = b.slice(k);

      if (arraysEqual(aRest, bRest)) {
        result.push(...aRest);
      } else {
        conflict = true;
        conflicts.push({
          a: aRest,
          o: o.slice(j),
          b: bRest
        });
        result.push('<<<<<<<');
        result.push(...aRest);
        result.push('=======');
        result.push(...bRest);
        result.push('>>>>>>>');
      }
      break;
    }
  }

  return { conflict, result, conflicts };
}

/**
 * Find next common line in all three
 */
function findNextCommon(
  a: string[], o: string[], b: string[],
  startA: number, startO: number, startB: number
): { ai: number; oi: number; bi: number } | null {
  for (let i = startA; i < a.length; i++) {
    for (let j = startO; j < o.length; j++) {
      if (a[i] === o[j]) {
        for (let k = startB; k < b.length; k++) {
          if (o[j] === b[k]) {
            return { ai: i, oi: j, bi: k };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Check if two arrays are equal
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Merge text strings (convenience function)
 */
export function mergeStrings(a: string, o: string, b: string): MergeResult {
  return merge3(
    a.split('\n'),
    o.split('\n'),
    b.split('\n')
  );
}

export default merge3;

// CLI Demo
if (import.meta.url.includes("elide-node-diff3.ts")) {
  console.log("🔀 Node Diff3 - 3-Way Merge for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Clean Merge ===");
  const original = ["line 1", "line 2", "line 3"];
  const versionA = ["line 1", "line 2 modified", "line 3"];
  const versionB = ["line 1", "line 2", "line 3", "line 4"];
  const result1 = merge3(versionA, original, versionB);
  console.log("Original:", original);
  console.log("Version A:", versionA);
  console.log("Version B:", versionB);
  console.log("Merge result:", result1.result);
  console.log("Conflicts:", result1.conflict);
  console.log();

  console.log("=== Example 2: Merge Conflict ===");
  const orig2 = ["Hello", "World"];
  const ver2A = ["Hello", "Beautiful World"];
  const ver2B = ["Hello", "Amazing World"];
  const result2 = merge3(ver2A, orig2, ver2B);
  console.log("Original:", orig2);
  console.log("Version A:", ver2A);
  console.log("Version B:", ver2B);
  console.log("Merge result:");
  console.log(result2.result.join('\n'));
  console.log("Has conflicts:", result2.conflict);
  console.log("Number of conflicts:", result2.conflicts.length);
  console.log();

  console.log("=== Example 3: String Merge ===");
  const origStr = "line 1\nline 2\nline 3";
  const aStr = "line 1\nline 2 changed\nline 3";
  const bStr = "line 1\nline 2\nline 3\nline 4";
  const result3 = mergeStrings(aStr, origStr, bStr);
  console.log("Merged:");
  console.log(result3.result.join('\n'));
  console.log();

  console.log("=== Example 4: Both Same Change ===");
  const orig4 = ["old line"];
  const ver4A = ["new line"];
  const ver4B = ["new line"];
  const result4 = merge3(ver4A, orig4, ver4B);
  console.log("Original:", orig4);
  console.log("Both changed to:", ver4A);
  console.log("Result:", result4.result);
  console.log("Conflicts:", result4.conflict);
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same diff3 works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One merge algorithm, all languages");
  console.log("  ✓ Consistent conflict resolution");
  console.log("  ✓ Perfect for version control");
  console.log("  ✓ ~50K+ downloads/week on npm");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Version control systems");
  console.log("- Collaborative editing");
  console.log("- Merge conflict resolution");
  console.log("- File synchronization");
}
