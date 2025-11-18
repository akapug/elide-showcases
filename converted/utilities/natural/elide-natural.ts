/**
 * Natural - Natural Language Processing Library
 *
 * Features:
 * - Tokenization
 * - Stemming
 * - String distance
 * - N-grams
 * - Phonetics
 *
 * Package has ~3M+ downloads/week on npm!
 */

// Porter Stemmer - basic implementation
export function stem(word: string): string {
  const step2list: Record<string, string> = {
    ational: 'ate',
    tional: 'tion',
    enci: 'ence',
    anci: 'ance',
    izer: 'ize',
    abli: 'able',
    alli: 'al',
    entli: 'ent',
    eli: 'e',
    ousli: 'ous',
    ization: 'ize',
    ation: 'ate',
    ator: 'ate',
    alism: 'al',
    iveness: 'ive',
    fulness: 'ful',
    ousness: 'ous',
    aliti: 'al',
    iviti: 'ive',
    biliti: 'ble',
  };

  let w = word.toLowerCase();

  // Simple stemming rules
  if (w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.endsWith('es')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);

  for (const [suffix, replacement] of Object.entries(step2list)) {
    if (w.endsWith(suffix)) {
      return w.slice(0, -suffix.length) + replacement;
    }
  }

  return w;
}

// Tokenizer
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// N-grams
export function ngrams(sequence: string[], n: number): string[][] {
  const result: string[][] = [];
  for (let i = 0; i <= sequence.length - n; i++) {
    result.push(sequence.slice(i, i + n));
  }
  return result;
}

// Levenshtein distance
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i * (a.length + 1)] = i;
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      const idx = i * (a.length + 1) + j;
      matrix[idx] = Math.min(
        matrix[(i - 1) * (a.length + 1) + j] + 1,
        matrix[i * (a.length + 1) + (j - 1)] + 1,
        matrix[(i - 1) * (a.length + 1) + (j - 1)] + cost
      );
    }
  }

  return matrix[b.length * (a.length + 1) + a.length];
}

export default {
  stem,
  tokenize,
  ngrams,
  levenshtein,
};

if (import.meta.url.includes("natural")) {
  console.log("Stem 'running':", stem("running"));
  console.log("Stem 'flies':", stem("flies"));
  console.log("Tokenize:", tokenize("Hello, world! This is a test."));
  console.log("Bigrams:", ngrams(["hello", "world", "test"], 2));
  console.log("Levenshtein:", levenshtein("kitten", "sitting"));
}
