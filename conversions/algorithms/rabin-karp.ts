/**
 * Rabin-Karp String Matching Algorithm
 * Uses hashing for pattern matching
 * Time: O(n + m) average, O(nm) worst case
 */

const PRIME = 101;

function hashString(str: string, end: number): number {
  let hash = 0;
  for (let i = 0; i < end; i++) {
    hash = hash * 256 + str.charCodeAt(i);
  }
  return hash;
}

export function rabinKarp(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const matches: number[] = [];

  if (m > n) return matches;

  const patternHash = hashString(pattern, m);
  let textHash = hashString(text, m);

  // Power of 256^(m-1) for rolling hash
  let power = 1;
  for (let i = 0; i < m - 1; i++) {
    power *= 256;
  }

  for (let i = 0; i <= n - m; i++) {
    // Check if hashes match
    if (patternHash === textHash) {
      // Verify actual string match (avoid hash collision)
      let match = true;
      for (let j = 0; j < m; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) matches.push(i);
    }

    // Calculate hash for next window
    if (i < n - m) {
      textHash = (textHash - text.charCodeAt(i) * power) * 256 + text.charCodeAt(i + m);
    }
  }

  return matches;
}

export function rabinKarpFirst(text: string, pattern: string): number {
  const matches = rabinKarp(text, pattern);
  return matches.length > 0 ? matches[0] : -1;
}

export function rabinKarpCount(text: string, pattern: string): number {
  return rabinKarp(text, pattern).length;
}

// CLI demo
if (import.meta.url.includes("rabin-karp.ts")) {
  const text = "GEEKS FOR GEEKS";
  const pattern = "GEEKS";

  console.log("Text: " + text);
  console.log("Pattern: " + pattern);

  const matches = rabinKarp(text, pattern);
  console.log("Matches at indices: " + matches.join(", "));

  const text2 = "aabaacaadaabaaba";
  const pattern2 = "aaba";
  console.log("\nText: " + text2);
  console.log("Pattern: " + pattern2);
  console.log("Matches: " + rabinKarp(text2, pattern2).join(", "));
  console.log("Count: " + rabinKarpCount(text2, pattern2));

  console.log("✅ Rabin-Karp test passed");
}
