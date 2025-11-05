/**
 * String Similarity
 * Various algorithms to measure string similarity
 */

// Jaro-Winkler similarity
export function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);

  // Find common prefix length (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + (prefix * 0.1 * (1 - jaro));
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const maxDist = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return ((matches / s1.length) + (matches / s2.length) + ((matches - transpositions / 2) / matches)) / 3.0;
}

// Cosine similarity
export function cosineSimilarity(s1: string, s2: string): number {
  const tokens1 = tokenize(s1);
  const tokens2 = tokenize(s2);

  const vector1 = vectorize(tokens1);
  const vector2 = vectorize(tokens2);

  const allTokens = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const token of allTokens) {
    const v1 = vector1[token] || 0;
    const v2 = vector2[token] || 0;

    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function tokenize(str: string): string[] {
  return str.toLowerCase().split(/\W+/).filter(t => t.length > 0);
}

function vectorize(tokens: string[]): Record<string, number> {
  const vector: Record<string, number> = {};
  tokens.forEach(token => {
    vector[token] = (vector[token] || 0) + 1;
  });
  return vector;
}

// Dice coefficient
export function diceCoefficient(s1: string, s2: string): number {
  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  if (bigrams1.size === 0 && bigrams2.size === 0) return 1.0;
  if (bigrams1.size === 0 || bigrams2.size === 0) return 0.0;

  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));

  return (2.0 * intersection.size) / (bigrams1.size + bigrams2.size);
}

function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

// CLI demo
if (import.meta.url.includes("string-similarity.ts")) {
  console.log("String Similarity Demo\n");

  const pairs = [
    ["hello", "hallo"],
    ["night", "nacht"],
    ["context", "contact"],
    ["abc", "xyz"]
  ];

  pairs.forEach(([s1, s2]) => {
    console.log(`"${s1}" vs "${s2}":`);
    console.log(`  Jaro-Winkler: ${jaroWinkler(s1, s2).toFixed(3)}`);
    console.log(`  Cosine: ${cosineSimilarity(s1, s2).toFixed(3)}`);
    console.log(`  Dice: ${diceCoefficient(s1, s2).toFixed(3)}`);
    console.log();
  });

  console.log("✅ String similarity test passed");
}
