/**
 * Syllable - Syllable Counter
 *
 * Count syllables in English words with high accuracy.
 * **POLYGLOT SHOWCASE**: One syllable counter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/syllable (~20K+ downloads/week)
 *
 * Features:
 * - Accurate syllable counting for English words
 * - Handles special cases (silent e, vowel clusters, etc.)
 * - Exception dictionary for irregular words
 * - Fast and lightweight
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need syllable counting
 * - ONE implementation works everywhere on Elide
 * - Consistent text metrics across languages
 * - Share readability algorithms across your stack
 *
 * Use cases:
 * - Readability scoring (Flesch-Kincaid, etc.)
 * - Poetry analysis (meter detection)
 * - Text-to-speech systems
 * - Educational applications
 *
 * Package has ~20K+ downloads/week on npm - essential NLP utility!
 */

// Exception dictionary for irregular words
const EXCEPTIONS: Record<string, number> = {
  // Common irregular words
  simile: 3,
  forever: 3,
  shoreline: 2,
  hours: 1,
  lieutenant: 3,
  business: 2,
  people: 2,
  beautiful: 3,
  different: 3,
  family: 3,
  every: 2,
  several: 3,
  chocolate: 3,
  favorite: 3,
  memory: 3,
  literally: 4,
  probably: 3,
  definitely: 4,
  actually: 4,
  totally: 3,
  basically: 4,
  generally: 4,
  especially: 4,
  usually: 3,
  really: 2,
  personally: 4,
  practically: 4,
};

// Syllable addition patterns (add syllables)
const SYLLABLE_ADD = [
  /ia(?!n)/g,
  /riet/g,
  /dien/g,
  /iu/g,
  /io/g,
  /ii/g,
  /[aeiou]{3}/g,
  /[aeiou]{2}(?=[^aeiou]|$)/g,
  /[aeiou](?=[^aeiou])/g,
];

// Syllable subtraction patterns (remove syllables)
const SYLLABLE_SUBTRACT = [
  /cia(?:l|$)/g,
  /tia/g,
  /cius/g,
  /cious/g,
  /[^aeiou]giu/g,
  /[aeiouy][^aeiouy]e$/,
  /e$/,
  /eous$/,
  /ied$/,
  /[aeiou]ed$/,
  /[aeiouy]ely$/,
];

/**
 * Count syllables in a word
 */
export function syllable(word: string): number {
  if (!word || typeof word !== 'string') {
    return 0;
  }

  // Normalize word
  const normalized = word.toLowerCase().trim();

  // Check exceptions first
  if (EXCEPTIONS[normalized]) {
    return EXCEPTIONS[normalized];
  }

  let count = 0;
  let workingWord = normalized;

  // Single letter words
  if (workingWord.length === 1) {
    return 1;
  }

  // Count vowel groups
  for (const pattern of SYLLABLE_ADD) {
    const matches = workingWord.match(pattern);
    if (matches) {
      count += matches.length;
      workingWord = workingWord.replace(pattern, ' ');
    }
  }

  // Subtract silent syllables
  for (const pattern of SYLLABLE_SUBTRACT) {
    const matches = workingWord.match(pattern);
    if (matches) {
      count -= matches.length;
    }
  }

  // Minimum of 1 syllable
  return Math.max(1, count);
}

/**
 * Count total syllables in a sentence or paragraph
 */
export function syllables(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return words.reduce((total, word) => total + syllable(word), 0);
}

export default syllable;

// CLI Demo
if (import.meta.url.includes("elide-syllable.ts")) {
  console.log("🔢 Syllable Counter for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Syllable Counting ===");
  const words = ["hello", "world", "beautiful", "definitely", "actually"];
  words.forEach((word) => {
    console.log(`${word}: ${syllable(word)} syllable${syllable(word) === 1 ? "" : "s"}`);
  });
  console.log();

  console.log("=== Example 2: Common Words ===");
  const common = [
    "the", "and", "for", "are", "but", "not", "you", "all",
    "can", "her", "was", "one", "our", "out", "day"
  ];
  console.log(common.map(w => `${w}(${syllable(w)})`).join(", "));
  console.log();

  console.log("=== Example 3: Complex Words ===");
  const complex = [
    "antidisestablishmentarianism",
    "supercalifragilisticexpialidocious",
    "pseudopseudohypoparathyroidism",
    "incomprehensibilities"
  ];
  complex.forEach((word) => {
    console.log(`${word}: ${syllable(word)} syllables`);
  });
  console.log();

  console.log("=== Example 4: Text Analysis ===");
  const text1 = "The quick brown fox jumps over the lazy dog";
  const text2 = "To be or not to be, that is the question";
  console.log(`"${text1}"`);
  console.log(`Total syllables: ${syllables(text1)}`);
  console.log();
  console.log(`"${text2}"`);
  console.log(`Total syllables: ${syllables(text2)}`);
  console.log();

  console.log("=== Example 5: Readability Score (Flesch-Kincaid) ===");
  const passage = "The cat sat on the mat. It was a beautiful day. The sun was shining brightly.";
  const totalWords = passage.split(/\s+/).length;
  const totalSyllables = syllables(passage);
  const totalSentences = passage.split(/[.!?]/).filter(s => s.trim()).length;

  const avgSyllablesPerWord = totalSyllables / totalWords;
  const avgWordsPerSentence = totalWords / totalSentences;
  const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  console.log(`Text: "${passage}"`);
  console.log(`Words: ${totalWords}`);
  console.log(`Syllables: ${totalSyllables}`);
  console.log(`Sentences: ${totalSentences}`);
  console.log(`Flesch-Kincaid Grade Level: ${fleschKincaid.toFixed(2)}`);
  console.log();

  console.log("=== Example 6: Poetry Meter Analysis ===");
  const poemLine = "Shall I compare thee to a summer's day";
  const poemWords = poemLine.split(/\s+/);
  console.log(`Line: "${poemLine}"`);
  console.log("Syllables per word:");
  poemWords.forEach((word) => {
    console.log(`  ${word}: ${"•".repeat(syllable(word))}`);
  });
  console.log(`Total: ${syllables(poemLine)} syllables`);
  console.log();

  console.log("=== Example 7: Exception Handling ===");
  const irregular = ["business", "people", "chocolate", "literally", "probably"];
  console.log("Words with irregular syllables:");
  irregular.forEach((word) => {
    console.log(`  ${word}: ${syllable(word)} syllables`);
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same syllable counter works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Consistent readability metrics across languages");
  console.log("  ✓ Share text analysis logic across your stack");
  console.log("  ✓ One algorithm for all NLP pipelines");
  console.log("  ✓ Build multilingual text tools easily");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Readability scoring (Flesch-Kincaid, SMOG, etc.)");
  console.log("- Poetry analysis and meter detection");
  console.log("- Text-to-speech systems");
  console.log("- Educational applications");
  console.log("- Content complexity analysis");
  console.log("- SEO optimization");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~20K+ downloads/week on npm!");
}
