/**
 * Diff Sequences - Sequence Comparison Algorithm
 *
 * Compare items in two sequences to find a longest common subsequence.
 * **POLYGLOT SHOWCASE**: One sequence diff for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/diff-sequences (~10M+ downloads/week)
 *
 * Features:
 * - Longest common subsequence (LCS)
 * - Optimized diff algorithm
 * - Works with any comparable items
 * - Used by Jest for test diffs
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need sequence diffing
 * - ONE implementation works everywhere on Elide
 * - Consistent diff output across languages
 * - Share testing logic across your stack
 *
 * Use cases:
 * - Test assertion diffs
 * - Array/list comparison
 * - Data structure diffing
 * - Change detection
 *
 * Package has ~10M+ downloads/week on npm - used by Jest!
 */

export type Callbacks = {
  foundSubsequence: (nCommon: number, aCommon: number, bCommon: number) => void;
};

/**
 * Compare sequences and find differences
 */
export default function diffSequences(
  aLength: number,
  bLength: number,
  isCommon: (aIndex: number, bIndex: number) => boolean,
  callbacks: Callbacks
): void {
  // Handle edge cases
  if (aLength === 0 || bLength === 0) {
    return;
  }

  // Find common prefix
  let nCommon = 0;
  while (nCommon < aLength && nCommon < bLength && isCommon(nCommon, nCommon)) {
    nCommon++;
  }

  if (nCommon > 0) {
    callbacks.foundSubsequence(nCommon, 0, 0);
  }

  if (nCommon === aLength || nCommon === bLength) {
    return;
  }

  // Find common suffix
  let aEnd = aLength - 1;
  let bEnd = bLength - 1;
  let nCommonSuffix = 0;
  while (aEnd >= nCommon && bEnd >= nCommon && isCommon(aEnd, bEnd)) {
    aEnd--;
    bEnd--;
    nCommonSuffix++;
  }

  // Myers diff in the middle
  myersDiff(
    nCommon,
    aEnd + 1,
    bEnd + 1,
    isCommon,
    callbacks
  );

  // Report common suffix
  if (nCommonSuffix > 0) {
    callbacks.foundSubsequence(nCommonSuffix, aEnd + 1, bEnd + 1);
  }
}

/**
 * Myers diff algorithm
 */
function myersDiff(
  aStart: number,
  aEnd: number,
  bEnd: number,
  isCommon: (aIndex: number, bIndex: number) => boolean,
  callbacks: Callbacks
): void {
  const aLength = aEnd - aStart;
  const bLength = bEnd - aStart;
  const bStart = aStart;

  if (aLength === 0 || bLength === 0) {
    return;
  }

  // Simple case: one element
  if (aLength === 1 && bLength === 1) {
    if (isCommon(aStart, bStart)) {
      callbacks.foundSubsequence(1, aStart, bStart);
    }
    return;
  }

  // Find middle snake
  const delta = aLength - bLength;
  const snake = findMiddleSnake(aStart, aEnd, bStart, bEnd, isCommon);

  if (snake) {
    const { x, y, u, v } = snake;

    // Recurse on left and right
    myersDiff(aStart, x, bStart, isCommon, callbacks);

    if (u > x) {
      callbacks.foundSubsequence(u - x, x, y);
    }

    myersDiff(u, aEnd, v, isCommon, callbacks);
  }
}

/**
 * Find middle snake for Myers algorithm
 */
function findMiddleSnake(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  isCommon: (aIndex: number, bIndex: number) => boolean
): { x: number; y: number; u: number; v: number } | null {
  const aLength = aEnd - aStart;
  const bLength = bEnd - bStart;
  const delta = aLength - bLength;
  const deltaOdd = delta % 2 !== 0;
  const max = Math.ceil((aLength + bLength) / 2);

  const vForward = new Map<number, number>();
  const vBackward = new Map<number, number>();
  vForward.set(1, 0);
  vBackward.set(1, 0);

  for (let d = 0; d <= max; d++) {
    // Forward
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (vForward.get(k - 1) ?? -1) < (vForward.get(k + 1) ?? -1))) {
        x = vForward.get(k + 1) ?? 0;
      } else {
        x = (vForward.get(k - 1) ?? 0) + 1;
      }

      let y = x - k;

      while (x < aLength && y < bLength && isCommon(aStart + x, bStart + y)) {
        x++;
        y++;
      }

      vForward.set(k, x);

      if (deltaOdd && k >= delta - (d - 1) && k <= delta + (d - 1)) {
        const revK = delta - k;
        const revX = vBackward.get(revK) ?? 0;
        if (aLength - revX <= x) {
          return {
            x: aStart + x,
            y: bStart + y,
            u: aStart + x,
            v: bStart + y
          };
        }
      }
    }

    // Backward
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (vBackward.get(k - 1) ?? -1) < (vBackward.get(k + 1) ?? -1))) {
        x = vBackward.get(k + 1) ?? 0;
      } else {
        x = (vBackward.get(k - 1) ?? 0) + 1;
      }

      let y = x - k;

      while (x < aLength && y < bLength &&
             isCommon(aEnd - 1 - x, bEnd - 1 - y)) {
        x++;
        y++;
      }

      vBackward.set(k, x);
    }
  }

  return null;
}

/**
 * Helper: diff two arrays
 */
export function diffArrays<T>(a: T[], b: T[]): Array<{ type: 'common' | 'remove' | 'add'; items: T[] }> {
  const result: Array<{ type: 'common' | 'remove' | 'add'; items: T[] }> = [];
  let aIndex = 0;
  let bIndex = 0;

  diffSequences(
    a.length,
    b.length,
    (aIdx, bIdx) => a[aIdx] === b[bIdx],
    {
      foundSubsequence: (nCommon, aCommon, bCommon) => {
        // Add removals
        if (aIndex < aCommon) {
          result.push({ type: 'remove', items: a.slice(aIndex, aCommon) });
        }
        // Add additions
        if (bIndex < bCommon) {
          result.push({ type: 'add', items: b.slice(bIndex, bCommon) });
        }
        // Add common
        result.push({ type: 'common', items: a.slice(aCommon, aCommon + nCommon) });
        aIndex = aCommon + nCommon;
        bIndex = bCommon + nCommon;
      }
    }
  );

  // Handle remaining
  if (aIndex < a.length) {
    result.push({ type: 'remove', items: a.slice(aIndex) });
  }
  if (bIndex < b.length) {
    result.push({ type: 'add', items: b.slice(bIndex) });
  }

  return result;
}

// CLI Demo
if (import.meta.url.includes("elide-diff-sequences.ts")) {
  console.log("🔍 Diff Sequences - Sequence Comparison for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Array Diff ===");
  const arr1 = [1, 2, 3, 4, 5];
  const arr2 = [1, 2, 4, 5, 6];
  const diff = diffArrays(arr1, arr2);
  console.log("Array 1:", arr1);
  console.log("Array 2:", arr2);
  console.log("Diff:");
  diff.forEach(({ type, items }) => {
    console.log(`  ${type.toUpperCase()}: [${items.join(', ')}]`);
  });
  console.log();

  console.log("=== Example 2: String Array Diff ===");
  const words1 = ["hello", "world", "foo"];
  const words2 = ["hello", "there", "world"];
  const wordDiff = diffArrays(words1, words2);
  console.log("Words 1:", words1);
  console.log("Words 2:", words2);
  console.log("Changes:");
  wordDiff.forEach(({ type, items }) => {
    if (type === 'remove') console.log(`  - ${items.join(', ')}`);
    if (type === 'add') console.log(`  + ${items.join(', ')}`);
  });
  console.log();

  console.log("=== Example 3: Custom Comparison ===");
  const nums1 = [10, 20, 30, 40];
  const nums2 = [10, 25, 30, 45];
  console.log("Numbers 1:", nums1);
  console.log("Numbers 2:", nums2);

  diffSequences(
    nums1.length,
    nums2.length,
    (i, j) => nums1[i] === nums2[j],
    {
      foundSubsequence: (n, aIdx, bIdx) => {
        console.log(`  Common: ${n} items at position ${aIdx}`);
      }
    }
  );
  console.log();

  console.log("=== Example 4: Test Assertions (Jest-like) ===");
  const expected = ["a", "b", "c"];
  const received = ["a", "x", "c"];
  const testDiff = diffArrays(expected, received);
  console.log("Expected:", expected);
  console.log("Received:", received);
  console.log("Diff:");
  testDiff.forEach(({ type, items }) => {
    if (type === 'common') console.log(`  = ${items.join(', ')}`);
    if (type === 'remove') console.log(`  - ${items.join(', ')} (expected)`);
    if (type === 'add') console.log(`  + ${items.join(', ')} (received)`);
  });
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same diff-sequences works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One sequence diff, all languages");
  console.log("  ✓ Used by Jest for test diffs");
  console.log("  ✓ Perfect for testing frameworks");
  console.log("  ✓ ~10M+ downloads/week on npm");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Test assertion diffs");
  console.log("- Array/list comparison");
  console.log("- Data structure diffing");
  console.log("- Change detection");
}
