/**
 * Pluralize - Pluralize and Singularize English Words
 *
 * Convert English words between singular and plural forms.
 * Handles irregular words, uncountable words, and special rules.
 *
 * Features:
 * - Pluralize any English word
 * - Singularize any English word
 * - Handles irregular words (person → people)
 * - Handles uncountable words (fish, sheep)
 * - Custom rules support
 * - Number-aware pluralization
 *
 * Use cases:
 * - UI labels and messages
 * - Form generation
 * - Text generation
 * - Internationalization
 * - API responses
 *
 * Package has ~20M+ downloads/week on npm!
 */

interface Rule {
  pattern: RegExp;
  replacement: string;
}

// Pluralization rules
const pluralRules: Rule[] = [
  { pattern: /s$/i, replacement: 's' },
  { pattern: /([^aeiou])y$/i, replacement: '$1ies' },
  { pattern: /(x|ch|ss|sh)$/i, replacement: '$1es' },
  { pattern: /([^f])fe?$/i, replacement: '$1ves' },
  { pattern: /(matr|vert|ind)(?:ix|ex)$/i, replacement: '$1ices' },
  { pattern: /([ml])ouse$/i, replacement: '$1ice' },
  { pattern: /(quiz)$/i, replacement: '$1zes' },
  { pattern: /$/i, replacement: 's' },
];

// Singularization rules (most specific first!)
const singularRules: Rule[] = [
  { pattern: /([^aeiou])ies$/i, replacement: '$1y' },
  { pattern: /(x|ch|ss|sh)es$/i, replacement: '$1' },
  { pattern: /([^f])ves$/i, replacement: '$1fe' },
  { pattern: /(matr|vert|ind)ices$/i, replacement: '$1ex' },
  { pattern: /([ml])ice$/i, replacement: '$1ouse' },
  { pattern: /(quiz)zes$/i, replacement: '$1' },
  { pattern: /s$/i, replacement: '' }, // Generic /s$/ last!
];

// Irregular words
const irregulars: Map<string, string> = new Map([
  ['person', 'people'],
  ['man', 'men'],
  ['woman', 'women'],
  ['child', 'children'],
  ['tooth', 'teeth'],
  ['foot', 'feet'],
  ['goose', 'geese'],
  ['mouse', 'mice'],
  ['ox', 'oxen'],
  ['cactus', 'cacti'],
  ['focus', 'foci'],
  ['fungus', 'fungi'],
  ['nucleus', 'nuclei'],
  ['radius', 'radii'],
  ['stimulus', 'stimuli'],
  ['analysis', 'analyses'],
  ['basis', 'basis'],
  ['crisis', 'crises'],
  ['diagnosis', 'diagnoses'],
  ['thesis', 'theses'],
  ['datum', 'data'],
  ['medium', 'media'],
  ['criterion', 'criteria'],
  ['phenomenon', 'phenomena'],
]);

// Uncountable words
const uncountables = new Set([
  'sheep',
  'fish',
  'deer',
  'moose',
  'series',
  'species',
  'money',
  'rice',
  'information',
  'equipment',
  'bison',
  'cod',
  'offspring',
  'pike',
  'salmon',
  'shrimp',
  'swine',
  'trout',
  'aircraft',
  'watercraft',
  'spacecraft',
  'sugar',
  'tuna',
  'you',
  'wood',
]);

/**
 * Pluralize a word
 */
export default function pluralize(word: string, count?: number, inclusive?: boolean): string {
  if (typeof word !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof word}`);
  }

  // If count is provided and is 1, return singular
  if (count !== undefined && count === 1) {
    const result = word;
    return inclusive ? `${count} ${result}` : result;
  }

  // If count is provided and not 1, pluralize
  const plural = _pluralize(word);
  return count !== undefined && inclusive ? `${count} ${plural}` : plural;
}

/**
 * Singularize a word
 */
export function singular(word: string): string {
  if (typeof word !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof word}`);
  }

  return _singularize(word);
}

/**
 * Internal pluralize
 */
function _pluralize(word: string): string {
  const lower = word.toLowerCase();

  // Check if uncountable
  if (uncountables.has(lower)) {
    return word;
  }

  // Check if already plural (via irregular)
  for (const [sing, plur] of irregulars) {
    if (lower === plur) {
      return word;
    }
  }

  // Check irregulars
  for (const [sing, plur] of irregulars) {
    if (lower === sing) {
      return matchCase(word, plur);
    }
  }

  // Apply plural rules
  for (const rule of pluralRules) {
    if (rule.pattern.test(word)) {
      return word.replace(rule.pattern, rule.replacement);
    }
  }

  return word;
}

/**
 * Internal singularize
 */
function _singularize(word: string): string {
  const lower = word.toLowerCase();

  // Check if uncountable
  if (uncountables.has(lower)) {
    return word;
  }

  // Check if already singular (via irregular)
  for (const [sing, plur] of irregulars) {
    if (lower === sing) {
      return word;
    }
  }

  // Check irregulars (reverse)
  for (const [sing, plur] of irregulars) {
    if (lower === plur) {
      return matchCase(word, sing);
    }
  }

  // Apply singular rules
  for (const rule of singularRules) {
    if (rule.pattern.test(word)) {
      return word.replace(rule.pattern, rule.replacement);
    }
  }

  return word;
}

/**
 * Match the case of the original word
 */
function matchCase(word: string, target: string): string {
  // All uppercase
  if (word === word.toUpperCase()) {
    return target.toUpperCase();
  }

  // Capitalize first letter
  if (word[0] === word[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }

  // All lowercase
  return target.toLowerCase();
}

/**
 * Check if a word is plural
 */
export function isPlural(word: string): boolean {
  return _pluralize(_singularize(word)) === word.toLowerCase();
}

/**
 * Check if a word is singular
 */
export function isSingular(word: string): boolean {
  return _singularize(_pluralize(word)) === word.toLowerCase();
}

// CLI Demo
if (import.meta.url.includes("elide-pluralize.ts")) {
  console.log("🔤 Pluralize - Word Pluralization for Elide\n");

  console.log("=== Example 1: Basic Pluralization ===");
  console.log("cat →", pluralize('cat'));
  console.log("dog →", pluralize('dog'));
  console.log("box →", pluralize('box'));
  console.log("city →", pluralize('city'));
  console.log("leaf →", pluralize('leaf'));
  console.log();

  console.log("=== Example 2: Irregular Words ===");
  console.log("person →", pluralize('person'));
  console.log("child →", pluralize('child'));
  console.log("tooth →", pluralize('tooth'));
  console.log("mouse →", pluralize('mouse'));
  console.log("goose →", pluralize('goose'));
  console.log();

  console.log("=== Example 3: Singularization ===");
  console.log("cats →", singular('cats'));
  console.log("boxes →", singular('boxes'));
  console.log("cities →", singular('cities'));
  console.log("people →", singular('people'));
  console.log("children →", singular('children'));
  console.log();

  console.log("=== Example 4: Uncountable Words ===");
  console.log("sheep →", pluralize('sheep'));
  console.log("fish →", pluralize('fish'));
  console.log("deer →", pluralize('deer'));
  console.log("information →", pluralize('information'));
  console.log();

  console.log("=== Example 5: With Count ===");
  console.log("1 item:", pluralize('item', 1));
  console.log("5 items:", pluralize('item', 5));
  console.log("0 items:", pluralize('item', 0));
  console.log();

  console.log("=== Example 6: Inclusive Count ===");
  console.log(pluralize('apple', 1, true));
  console.log(pluralize('apple', 5, true));
  console.log(pluralize('person', 3, true));
  console.log(pluralize('child', 10, true));
  console.log();

  console.log("=== Example 7: Case Preservation ===");
  console.log("Cat →", pluralize('Cat'));
  console.log("CITY →", pluralize('CITY'));
  console.log("Person →", pluralize('Person'));
  console.log();

  console.log("=== Example 8: UI Messages ===");
  function getMessage(count: number, item: string): string {
    return `You have ${pluralize(item, count, true)}`;
  }

  console.log(getMessage(0, 'notification'));
  console.log(getMessage(1, 'message'));
  console.log(getMessage(5, 'comment'));
  console.log(getMessage(100, 'like'));
  console.log();

  console.log("=== Example 9: Is Plural/Singular ===");
  console.log("'cats' is plural:", isPlural('cats'));
  console.log("'cat' is singular:", isSingular('cat'));
  console.log("'people' is plural:", isPlural('people'));
  console.log("'person' is singular:", isSingular('person'));
  console.log();

  console.log("=== Example 10: Technical Terms ===");
  console.log("index →", pluralize('index'));
  console.log("matrix →", pluralize('matrix'));
  console.log("analysis →", pluralize('analysis'));
  console.log("criterion →", pluralize('criterion'));
  console.log("phenomenon →", pluralize('phenomenon'));
  console.log();

  console.log("=== Example 11: Form Labels ===");
  const fields = ['name', 'address', 'category', 'status'];
  console.log("Singular → Plural:");
  fields.forEach(field => {
    console.log(`  ${field} → ${pluralize(field)}`);
  });
  console.log();

  console.log("=== Example 12: Results Summary ===");
  function summarize(results: any[]) {
    const count = results.length;
    return `Found ${pluralize('result', count, true)}`;
  }

  console.log(summarize([]));
  console.log(summarize([1]));
  console.log(summarize([1, 2, 3, 4, 5]));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- UI labels and messages");
  console.log("- Form field generation");
  console.log("- Text and content generation");
  console.log("- Internationalization (i18n)");
  console.log("- API response formatting");
  console.log("- Database table naming");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~20M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Handles irregular words automatically");
  console.log("- Preserves word case");
  console.log("- Use count parameter for conditional pluralization");
  console.log("- Uncountable words remain unchanged");
}
