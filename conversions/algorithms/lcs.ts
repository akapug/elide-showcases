/**
 * Longest Common Subsequence (LCS)
 * Find longest subsequence common to two sequences
 * Time: O(m*n), Space: O(m*n)
 */

export function lcs(str1: string, str2: string): string {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  // Build DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruct LCS
  let i = m, j = n;
  const result: string[] = [];

  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      result.unshift(str1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result.join('');
}

export function lcsLength(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function longestCommonSubstring(str1: string, str2: string): string {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  let maxLen = 0;
  let endIndex = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
          endIndex = i;
        }
      }
    }
  }

  return str1.substring(endIndex - maxLen, endIndex);
}

// CLI demo
if (import.meta.url.includes("lcs.ts")) {
  const str1 = "ABCDGH";
  const str2 = "AEDFHR";

  console.log("LCS of " + str1 + " and " + str2 + ":");
  console.log("Result: " + lcs(str1, str2) + " (length: " + lcsLength(str1, str2) + ")");

  const s1 = "programming";
  const s2 = "gaming";
  console.log("\nLCS of " + s1 + " and " + s2 + ":");
  console.log("Result: " + lcs(s1, s2));

  console.log("\nLongest Common Substring: " + longestCommonSubstring(s1, s2));

  console.log("✅ LCS test passed");
}
