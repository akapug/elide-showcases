/**
 * Diff Generator
 * Generate diffs between strings/arrays
 */

export type ChangeType = 'add' | 'remove' | 'unchanged';

export interface DiffLine {
  type: ChangeType;
  value: string;
  lineNumber?: number;
}

export function diffLines(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  const diff: DiffLine[] = [];
  const lcs = longestCommonSubsequence(lines1, lines2);

  let i = 0, j = 0, k = 0;

  while (i < lines1.length || j < lines2.length) {
    if (k < lcs.length && i < lines1.length && lines1[i] === lcs[k]) {
      diff.push({ type: 'unchanged', value: lines1[i], lineNumber: i + 1 });
      i++;
      j++;
      k++;
    } else if (i < lines1.length && (k >= lcs.length || lines1[i] !== lcs[k])) {
      diff.push({ type: 'remove', value: lines1[i], lineNumber: i + 1 });
      i++;
    } else if (j < lines2.length) {
      diff.push({ type: 'add', value: lines2[j] });
      j++;
    }
  }

  return diff;
}

export function formatDiff(diff: DiffLine[]): string {
  return diff.map(line => {
    const prefix = line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  ';
    return prefix + line.value;
  }).join('\n');
}

export function unifiedDiff(text1: string, text2: string, context: number = 3): string {
  const lines = diffLines(text1, text2);
  let result = '--- a\n+++ b\n';

  let i = 0;
  while (i < lines.length) {
    // Find next change
    while (i < lines.length && lines[i].type === 'unchanged') i++;
    if (i >= lines.length) break;

    // Find context start
    const contextStart = Math.max(0, i - context);
    const changeStart = i;

    // Find change end
    while (i < lines.length && lines[i].type !== 'unchanged') i++;
    const changeEnd = i;

    // Skip context
    let contextEnd = i;
    while (contextEnd < lines.length && contextEnd < i + context && lines[contextEnd].type === 'unchanged') {
      contextEnd++;
    }

    // Generate hunk header
    const startLine = contextStart + 1;
    const endLine = contextEnd;
    result += `@@ -${startLine},${endLine - startLine} +${startLine},${endLine - startLine} @@\n`;

    // Output hunk
    for (let j = contextStart; j < contextEnd; j++) {
      const line = lines[j];
      const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
      result += prefix + line.value + '\n';
    }

    i = contextEnd;
  }

  return result;
}

function longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      result.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

export function diffWords(text1: string, text2: string): DiffLine[] {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const lcs = longestCommonSubsequence(words1, words2);
  const diff: DiffLine[] = [];

  let i = 0, j = 0, k = 0;

  while (i < words1.length || j < words2.length) {
    if (k < lcs.length && i < words1.length && words1[i] === lcs[k]) {
      diff.push({ type: 'unchanged', value: words1[i] });
      i++;
      j++;
      k++;
    } else if (i < words1.length && (k >= lcs.length || words1[i] !== lcs[k])) {
      diff.push({ type: 'remove', value: words1[i] });
      i++;
    } else if (j < words2.length) {
      diff.push({ type: 'add', value: words2[j] });
      j++;
    }
  }

  return diff;
}

// CLI demo
if (import.meta.url.includes("diff-generator.ts")) {
  console.log("Diff Generator Demo\n");

  const text1 = `Hello world
This is a test
Some content here`;

  const text2 = `Hello world
This is a demo
Some content here
New line added`;

  console.log("Line diff:");
  const lineDiff = diffLines(text1, text2);
  console.log(formatDiff(lineDiff));

  console.log("\nUnified diff:");
  console.log(unifiedDiff(text1, text2));

  console.log("\nWord diff:");
  const wordDiff = diffWords("The quick brown fox", "The fast brown dog");
  console.log(wordDiff.map(d => {
    if (d.type === 'add') return `[+${d.value}]`;
    if (d.type === 'remove') return `[-${d.value}]`;
    return d.value;
  }).join(' '));

  console.log("\n✅ Diff generator test passed");
}
