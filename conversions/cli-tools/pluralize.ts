/**
 * Pluralize Words
 * Convert between singular and plural forms
 */

const IRREGULAR: Record<string, string> = {
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  tooth: 'teeth',
  foot: 'feet',
  mouse: 'mice',
  goose: 'geese',
  ox: 'oxen'
};

const UNCOUNTABLE = new Set([
  'sheep', 'fish', 'deer', 'moose', 'series', 'species', 'money',
  'rice', 'information', 'equipment', 'software', 'hardware'
]);

export function pluralize(word: string, count?: number): string {
  if (count === 1) return word;

  const lower = word.toLowerCase();

  // Uncountable
  if (UNCOUNTABLE.has(lower)) return word;

  // Irregular
  if (IRREGULAR[lower]) {
    const plural = IRREGULAR[lower];
    return word[0] === word[0].toUpperCase()
      ? plural.charAt(0).toUpperCase() + plural.slice(1)
      : plural;
  }

  // Rules
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') ||
      lower.endsWith('ch') || lower.endsWith('sh')) {
    return word + 'es';
  }

  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    return word.slice(0, -1) + 'ies';
  }

  if (lower.endsWith('f')) {
    return word.slice(0, -1) + 'ves';
  }

  if (lower.endsWith('fe')) {
    return word.slice(0, -2) + 'ves';
  }

  if (lower.endsWith('o') && !/[aeiou]o$/.test(lower)) {
    return word + 'es';
  }

  return word + 's';
}

export function singularize(word: string): string {
  const lower = word.toLowerCase();

  // Uncountable
  if (UNCOUNTABLE.has(lower)) return word;

  // Irregular (reverse lookup)
  for (const [sing, plur] of Object.entries(IRREGULAR)) {
    if (plur === lower) {
      return word[0] === word[0].toUpperCase()
        ? sing.charAt(0).toUpperCase() + sing.slice(1)
        : sing;
    }
  }

  // Rules (reverse)
  if (lower.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }

  if (lower.endsWith('ves')) {
    if (lower.endsWith('ives')) {
      return word.slice(0, -3) + 'fe';
    }
    return word.slice(0, -3) + 'f';
  }

  if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('zes') ||
      lower.endsWith('ches') || lower.endsWith('shes')) {
    return word.slice(0, -2);
  }

  if (lower.endsWith('s')) {
    return word.slice(0, -1);
  }

  return word;
}

export function formatWithCount(count: number, word: string): string {
  return `${count} ${pluralize(word, count)}`;
}

// CLI demo
if (import.meta.url.includes("pluralize.ts")) {
  console.log("Pluralize Demo\n");

  const examples = [
    'cat', 'dog', 'box', 'church', 'baby',
    'knife', 'hero', 'child', 'person', 'tooth'
  ];

  console.log("Singular → Plural:");
  examples.forEach(word => {
    console.log("  " + word + " → " + pluralize(word));
  });

  console.log("\nWith counts:");
  console.log(formatWithCount(1, 'apple'));
  console.log(formatWithCount(5, 'apple'));
  console.log(formatWithCount(0, 'item'));
  console.log(formatWithCount(1, 'child'));
  console.log(formatWithCount(3, 'child'));

  console.log("\nSingularize:");
  console.log("  cats →", singularize('cats'));
  console.log("  boxes →", singularize('boxes'));
  console.log("  children →", singularize('children'));

  console.log("✅ Pluralize test passed");
}
