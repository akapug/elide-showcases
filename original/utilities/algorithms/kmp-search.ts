/**
 * Knuth-Morris-Pratt (KMP) String Matching Algorithm
 * Efficient pattern matching with preprocessing
 * Time: O(n + m), Space: O(m)
 */

function computeLPSArray(pattern: string): number[] {
  const m = pattern.length;
  const lps = new Array(m).fill(0);
  let len = 0;
  let i = 1;

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[i] = 0;
        i++;
      }
    }
  }

  return lps;
}

export function kmpSearch(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const matches: number[] = [];

  if (m === 0) return matches;

  const lps = computeLPSArray(pattern);
  let i = 0; // text index
  let j = 0; // pattern index

  while (i < n) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }

    if (j === m) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < n && text[i] !== pattern[j]) {
      if (j !== 0) {
        j = lps[j - 1];
      } else {
        i++;
      }
    }
  }

  return matches;
}

export function kmpSearchFirst(text: string, pattern: string): number {
  const matches = kmpSearch(text, pattern);
  return matches.length > 0 ? matches[0] : -1;
}

export function kmpSearchCount(text: string, pattern: string): number {
  return kmpSearch(text, pattern).length;
}

// CLI demo
if (import.meta.url.includes("kmp-search.ts")) {
  const text = "ABABDABACDABABCABAB";
  const pattern = "ABABCABAB";

  console.log("Text: " + text);
  console.log("Pattern: " + pattern);

  const matches = kmpSearch(text, pattern);
  console.log("Matches at indices: " + matches.join(", "));

  const text2 = "aabaacaadaabaaba";
  const pattern2 = "aaba";
  console.log("\nText: " + text2);
  console.log("Pattern: " + pattern2);
  console.log("Matches: " + kmpSearch(text2, pattern2).join(", "));
  console.log("Count: " + kmpSearchCount(text2, pattern2));

  console.log("✅ KMP search test passed");
}
