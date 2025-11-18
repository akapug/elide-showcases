/**
 * Dice Coefficient - String Similarity Metric
 *
 * Measure similarity between two strings using Sørensen-Dice coefficient.
 * **POLYGLOT SHOWCASE**: One similarity algorithm for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dice-coefficient (~20K+ downloads/week)
 *
 * Features:
 * - Sørensen-Dice coefficient implementation
 * - Bigram-based comparison
 * - Case-insensitive option
 * - Returns similarity score 0-1
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need string similarity
 * - ONE implementation works everywhere on Elide
 * - Consistent fuzzy matching across languages
 * - Share deduplication logic across your stack
 *
 * Use cases:
 * - Fuzzy string matching
 * - Duplicate detection
 * - Autocomplete/suggestions
 * - Record linkage
 *
 * Package has ~20K+ downloads/week on npm - essential text utility!
 */

/**
 * Generate bigrams from a string
 */
function bigrams(str: string): string[] {
  const pairs: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    pairs.push(str.slice(i, i + 2));
  }
  return pairs;
}

/**
 * Calculate Dice coefficient between two strings
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function diceCoefficient(str1: string, str2: string, caseSensitive = false): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  // Normalize strings
  const s1 = caseSensitive ? str1 : str1.toLowerCase();
  const s2 = caseSensitive ? str2 : str2.toLowerCase();

  // If either string is too short for bigrams
  if (s1.length < 2 || s2.length < 2) {
    return s1 === s2 ? 1 : 0;
  }

  // Get bigrams
  const bigrams1 = bigrams(s1);
  const bigrams2 = bigrams(s2);

  // Count intersections
  const set2 = new Set(bigrams2);
  let intersection = 0;

  for (const bigram of bigrams1) {
    if (set2.has(bigram)) {
      intersection++;
      set2.delete(bigram); // Count each bigram only once
    }
  }

  // Calculate coefficient: (2 * intersection) / (length1 + length2)
  return (2 * intersection) / (bigrams1.length + bigrams2.length);
}

/**
 * Find the most similar string from an array of candidates
 */
export function findMostSimilar(
  target: string,
  candidates: string[],
  threshold = 0
): { string: string; score: number } | null {
  let bestMatch: { string: string; score: number } | null = null;

  for (const candidate of candidates) {
    const score = diceCoefficient(target, candidate);
    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { string: candidate, score };
    }
  }

  return bestMatch;
}

/**
 * Find all similar strings above a threshold
 */
export function findSimilar(
  target: string,
  candidates: string[],
  threshold = 0.5
): Array<{ string: string; score: number }> {
  return candidates
    .map((candidate) => ({
      string: candidate,
      score: diceCoefficient(target, candidate),
    }))
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

export default diceCoefficient;

// CLI Demo
if (import.meta.url.includes("elide-dice-coefficient.ts")) {
  console.log("🎲 Dice Coefficient - String Similarity for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Similarity ===");
  const pairs = [
    ["hello", "hallo"],
    ["night", "nacht"],
    ["context", "contact"],
    ["algorithm", "altruistic"],
    ["apple", "orange"],
  ];

  pairs.forEach(([str1, str2]) => {
    const score = diceCoefficient(str1, str2);
    console.log(`"${str1}" vs "${str2}": ${(score * 100).toFixed(1)}%`);
  });
  console.log();

  console.log("=== Example 2: Case Sensitivity ===");
  const text1 = "JavaScript";
  const text2 = "javascript";
  console.log(`Case insensitive: ${(diceCoefficient(text1, text2, false) * 100).toFixed(1)}%`);
  console.log(`Case sensitive: ${(diceCoefficient(text1, text2, true) * 100).toFixed(1)}%`);
  console.log();

  console.log("=== Example 3: Typo Detection ===");
  const correct = "accommodation";
  const typos = [
    "acommodation",
    "accomodation",
    "accommadation",
    "accomodatoin",
  ];

  console.log(`Correct spelling: "${correct}"`);
  typos.forEach((typo) => {
    const score = diceCoefficient(correct, typo);
    console.log(`  "${typo}": ${(score * 100).toFixed(1)}% similar`);
  });
  console.log();

  console.log("=== Example 4: Finding Most Similar ===");
  const cities = ["San Francisco", "Los Angeles", "San Diego", "Sacramento", "San Jose"];
  const search = "San Fransisco";

  const match = findMostSimilar(search, cities);
  console.log(`Searching for: "${search}"`);
  if (match) {
    console.log(`Best match: "${match.string}" (${(match.score * 100).toFixed(1)}%)`);
  }
  console.log();

  console.log("=== Example 5: Autocomplete Suggestions ===");
  const commands = [
    "initialize",
    "install",
    "inspect",
    "integrate",
    "interpolate",
    "interpret",
    "investigate",
  ];
  const input = "intal";

  console.log(`User typed: "${input}"`);
  const suggestions = findSimilar(input, commands, 0.3);
  console.log("Suggestions:");
  suggestions.forEach((s) => {
    console.log(`  ${s.string} (${(s.score * 100).toFixed(1)}%)`);
  });
  console.log();

  console.log("=== Example 6: Duplicate Detection ===");
  const products = [
    "iPhone 13 Pro",
    "iPhone 13Pro",
    "i-Phone 13 Pro",
    "Samsung Galaxy S21",
    "Galaxy S21",
  ];

  console.log("Potential duplicates (>70% similar):");
  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const score = diceCoefficient(products[i], products[j]);
      if (score > 0.7) {
        console.log(`  "${products[i]}" ≈ "${products[j]}" (${(score * 100).toFixed(1)}%)`);
      }
    }
  }
  console.log();

  console.log("=== Example 7: Record Linkage ===");
  const database1 = ["John Smith", "Mary Johnson", "Robert Williams"];
  const database2 = ["Jon Smith", "Marie Johnson", "Bob Williams"];

  console.log("Matching records across databases:");
  database1.forEach((name1) => {
    const match = findMostSimilar(name1, database2, 0.6);
    if (match) {
      console.log(`  ${name1} → ${match.string} (${(match.score * 100).toFixed(1)}%)`);
    }
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same similarity algorithm works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Consistent fuzzy matching everywhere");
  console.log("  ✓ Share deduplication logic across services");
  console.log("  ✓ Build cross-platform search features");
  console.log("  ✓ One algorithm for all string comparisons");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Fuzzy string matching and search");
  console.log("- Duplicate detection in databases");
  console.log("- Autocomplete suggestions");
  console.log("- Spell checking and correction");
  console.log("- Record linkage and entity resolution");
  console.log("- Data cleaning and normalization");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast bigram-based algorithm");
  console.log("- ~20K+ downloads/week on npm!");
}
