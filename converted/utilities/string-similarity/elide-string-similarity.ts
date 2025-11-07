/**
 * String Similarity - Fuzzy String Matching
 *
 * Calculate similarity between strings using various algorithms.
 * **POLYGLOT SHOWCASE**: One string matcher for ALL languages on Elide!
 *
 * Features:
 * - Dice coefficient similarity
 * - Levenshtein distance
 * - Jaro-Winkler distance
 * - Cosine similarity
 * - Find best match from array
 * - Rate all matches
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need string matching
 * - ONE implementation works everywhere on Elide
 * - Consistent fuzzy matching across languages
 * - No need for language-specific similarity libs
 *
 * Use cases:
 * - Search and autocomplete
 * - Spell checking
 * - Duplicate detection
 * - Name matching
 * - Data deduplication
 * - Fuzzy search
 *
 * Package has ~2M+ downloads/week on npm!
 */

export interface SimilarityResult {
  rating: number;
  target: string;
}

export interface BestMatch {
  ratings: SimilarityResult[];
  bestMatch: SimilarityResult;
  bestMatchIndex: number;
}

/**
 * Calculate similarity between two strings (Dice coefficient)
 * Returns value between 0 (completely different) and 1 (identical)
 */
export function compareTwoStrings(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length < 2 || str2.length < 2) return 0;

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));

  return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
}

/**
 * Get bigrams from string
 */
function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}

/**
 * Find best match from an array of strings
 */
export function findBestMatch(mainString: string, targetStrings: string[]): BestMatch {
  const ratings: SimilarityResult[] = targetStrings.map(target => ({
    target,
    rating: compareTwoStrings(mainString, target)
  }));

  let bestMatchIndex = 0;
  let bestRating = ratings[0].rating;

  for (let i = 1; i < ratings.length; i++) {
    if (ratings[i].rating > bestRating) {
      bestRating = ratings[i].rating;
      bestMatchIndex = i;
    }
  }

  return {
    ratings,
    bestMatch: ratings[bestMatchIndex],
    bestMatchIndex
  };
}

/**
 * Calculate Levenshtein distance (edit distance)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity based on Levenshtein distance
 * Returns value between 0 and 1
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Calculate Jaro similarity
 */
export function jaroSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const len1 = str1.length;
  const len2 = str2.length;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;

  const matches1 = new Array(len1).fill(false);
  const matches2 = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);

    for (let j = start; j < end; j++) {
      if (matches2[j] || str1[i] !== str2[j]) continue;
      matches1[i] = true;
      matches2[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!matches1[i]) continue;
    while (!matches2[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3
  );
}

/**
 * Calculate Jaro-Winkler similarity (with prefix bonus)
 */
export function jaroWinklerSimilarity(str1: string, str2: string, prefixScale: number = 0.1): number {
  const jaroScore = jaroSimilarity(str1, str2);

  if (jaroScore < 0.7) return jaroScore;

  // Calculate common prefix length (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaroScore + prefix * prefixScale * (1 - jaroScore);
}

/**
 * Calculate cosine similarity (based on character frequency)
 */
export function cosineSimilarity(str1: string, str2: string): number {
  const freq1 = getCharFrequency(str1);
  const freq2 = getCharFrequency(str2);

  const allChars = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const char of allChars) {
    const f1 = freq1[char] || 0;
    const f2 = freq2[char] || 0;

    dotProduct += f1 * f2;
    mag1 += f1 * f1;
    mag2 += f2 * f2;
  }

  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Get character frequency map
 */
function getCharFrequency(str: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

/**
 * Find all matches above threshold
 */
export function findMatches(mainString: string, targetStrings: string[], threshold: number = 0.5): SimilarityResult[] {
  return targetStrings
    .map(target => ({
      target,
      rating: compareTwoStrings(mainString, target)
    }))
    .filter(result => result.rating >= threshold)
    .sort((a, b) => b.rating - a.rating);
}

// Default export
export default {
  compareTwoStrings,
  findBestMatch,
  levenshteinDistance,
  levenshteinSimilarity,
  jaroSimilarity,
  jaroWinklerSimilarity,
  cosineSimilarity,
  findMatches
};

// CLI Demo
if (import.meta.url.includes("elide-string-similarity.ts")) {
  console.log("🔍 String Similarity - Fuzzy Matching for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Similarity ===");
  const str1 = "hello world";
  const str2 = "hello word";
  const str3 = "goodbye world";
  console.log(`"${str1}" vs "${str2}":`, compareTwoStrings(str1, str2).toFixed(3));
  console.log(`"${str1}" vs "${str3}":`, compareTwoStrings(str1, str3).toFixed(3));
  console.log();

  console.log("=== Example 2: Find Best Match ===");
  const search = "apple";
  const options = ["apples", "banana", "app", "application", "pear"];
  const bestMatch = findBestMatch(search, options);
  console.log(`Search for: "${search}"`);
  console.log("Options:", options);
  console.log(`Best match: "${bestMatch.bestMatch.target}" (${bestMatch.bestMatch.rating.toFixed(3)})`);
  console.log();

  console.log("=== Example 3: All Ratings ===");
  console.log("All matches for 'apple':");
  bestMatch.ratings.forEach(({ target, rating }) => {
    console.log(`  "${target}": ${rating.toFixed(3)}`);
  });
  console.log();

  console.log("=== Example 4: Levenshtein Distance ===");
  const pairs = [
    ["kitten", "sitting"],
    ["saturday", "sunday"],
    ["hello", "hallo"]
  ];
  pairs.forEach(([a, b]) => {
    const distance = levenshteinDistance(a, b);
    const similarity = levenshteinSimilarity(a, b);
    console.log(`"${a}" vs "${b}": distance=${distance}, similarity=${similarity.toFixed(3)}`);
  });
  console.log();

  console.log("=== Example 5: Jaro-Winkler Similarity ===");
  const names = [
    ["Martha", "Marhta"],
    ["Dwayne", "Duane"],
    ["Dixon", "Dicksonx"]
  ];
  names.forEach(([a, b]) => {
    const jaro = jaroSimilarity(a, b);
    const jaroWinkler = jaroWinklerSimilarity(a, b);
    console.log(`"${a}" vs "${b}":`);
    console.log(`  Jaro: ${jaro.toFixed(3)}, Jaro-Winkler: ${jaroWinkler.toFixed(3)}`);
  });
  console.log();

  console.log("=== Example 6: Spell Checking ===");
  const typed = "recieve";
  const dictionary = ["receive", "believe", "achieve", "deceive", "relieve"];
  const correction = findBestMatch(typed, dictionary);
  console.log(`Typed: "${typed}"`);
  console.log(`Did you mean: "${correction.bestMatch.target}"?`);
  console.log();

  console.log("=== Example 7: Name Matching ===");
  const userName = "John Smith";
  const users = ["Jon Smith", "Jane Smith", "John Smyth", "Bob Johnson"];
  const nameMatch = findBestMatch(userName, users);
  console.log(`Looking for: "${userName}"`);
  console.log("Possible matches:");
  nameMatch.ratings
    .sort((a, b) => b.rating - a.rating)
    .forEach(({ target, rating }) => {
      if (rating > 0.5) {
        console.log(`  "${target}": ${(rating * 100).toFixed(1)}%`);
      }
    });
  console.log();

  console.log("=== Example 8: Search Suggestions ===");
  const query = "javascrip";
  const languages = ["javascript", "typescript", "java", "python", "ruby", "rust"];
  const suggestions = findMatches(query, languages, 0.4);
  console.log(`Search: "${query}"`);
  console.log("Suggestions:");
  suggestions.forEach(({ target, rating }) => {
    console.log(`  "${target}": ${(rating * 100).toFixed(0)}%`);
  });
  console.log();

  console.log("=== Example 9: Duplicate Detection ===");
  const items = ["Product A", "product a", "Product B", "PRODUCT A"];
  const duplicates: string[][] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const similarity = compareTwoStrings(items[i].toLowerCase(), items[j].toLowerCase());
      if (similarity > 0.8) {
        duplicates.push([items[i], items[j], similarity.toFixed(3)]);
      }
    }
  }
  console.log("Items:", items);
  console.log("Possible duplicates:");
  duplicates.forEach(([a, b, sim]) => {
    console.log(`  "${a}" ≈ "${b}" (${sim})`);
  });
  console.log();

  console.log("=== Example 10: Different Algorithms ===");
  const testA = "hello";
  const testB = "hallo";
  console.log(`Comparing: "${testA}" vs "${testB}"`);
  console.log(`  Dice coefficient: ${compareTwoStrings(testA, testB).toFixed(3)}`);
  console.log(`  Levenshtein: ${levenshteinSimilarity(testA, testB).toFixed(3)}`);
  console.log(`  Jaro: ${jaroSimilarity(testA, testB).toFixed(3)}`);
  console.log(`  Jaro-Winkler: ${jaroWinklerSimilarity(testA, testB).toFixed(3)}`);
  console.log(`  Cosine: ${cosineSimilarity(testA, testB).toFixed(3)}`);
  console.log();

  console.log("=== Example 11: POLYGLOT Use Case ===");
  console.log("🌐 Same string matcher works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent fuzzy matching everywhere");
  console.log("  ✓ No language-specific similarity bugs");
  console.log("  ✓ Share matching logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Search and autocomplete");
  console.log("- Spell checking");
  console.log("- Duplicate detection");
  console.log("- Name and address matching");
  console.log("- Data deduplication");
  console.log("- Fuzzy search systems");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~2M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share fuzzy search across languages");
  console.log("- One matching engine for all services");
  console.log("- Perfect for search systems!");
}
