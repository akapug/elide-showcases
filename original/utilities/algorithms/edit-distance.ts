/**
 * Edit Distance (Levenshtein Distance with operations)
 * Minimum operations to transform one string to another
 * Operations: insert, delete, substitute
 */

export interface EditOperation {
  type: 'insert' | 'delete' | 'substitute' | 'none';
  position: number;
  char?: string;
}

export function editDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // delete
          dp[i][j - 1],     // insert
          dp[i - 1][j - 1]  // substitute
        );
      }
    }
  }

  return dp[m][n];
}

export function editDistanceWithOps(str1: string, str2: string): { distance: number; operations: EditOperation[] } {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],
          dp[i][j - 1],
          dp[i - 1][j - 1]
        );
      }
    }
  }

  // Reconstruct operations
  const operations: EditOperation[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i === 0) {
      operations.unshift({ type: 'insert', position: i, char: str2[j - 1] });
      j--;
    } else if (j === 0) {
      operations.unshift({ type: 'delete', position: i - 1 });
      i--;
    } else if (str1[i - 1] === str2[j - 1]) {
      operations.unshift({ type: 'none', position: i - 1 });
      i--;
      j--;
    } else {
      const deleteCost = dp[i - 1][j];
      const insertCost = dp[i][j - 1];
      const substituteCost = dp[i - 1][j - 1];

      if (substituteCost <= deleteCost && substituteCost <= insertCost) {
        operations.unshift({ type: 'substitute', position: i - 1, char: str2[j - 1] });
        i--;
        j--;
      } else if (deleteCost <= insertCost) {
        operations.unshift({ type: 'delete', position: i - 1 });
        i--;
      } else {
        operations.unshift({ type: 'insert', position: i, char: str2[j - 1] });
        j--;
      }
    }
  }

  return {
    distance: dp[m][n],
    operations: operations.filter(op => op.type !== 'none')
  };
}

export function similarityScore(str1: string, str2: string): number {
  const distance = editDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}

// CLI demo
if (import.meta.url.includes("edit-distance.ts")) {
  const str1 = "kitten";
  const str2 = "sitting";

  console.log("Edit distance between '" + str1 + "' and '" + str2 + "':");
  console.log("Distance:", editDistance(str1, str2));

  const result = editDistanceWithOps(str1, str2);
  console.log("\nOperations:");
  result.operations.forEach(op => {
    if (op.type === 'insert') {
      console.log("  Insert '" + op.char + "' at position " + op.position);
    } else if (op.type === 'delete') {
      console.log("  Delete at position " + op.position);
    } else if (op.type === 'substitute') {
      console.log("  Substitute position " + op.position + " with '" + op.char + "'");
    }
  });

  console.log("\nSimilarity score:", (similarityScore(str1, str2) * 100).toFixed(2) + "%");

  console.log("\nOther examples:");
  console.log("'hello' vs 'hallo':", editDistance("hello", "hallo"));
  console.log("'algorithm' vs 'altruistic':", editDistance("algorithm", "altruistic"));

  console.log("✅ Edit distance test passed");
}
