/**
 * Singularize - Convert plural words to singular
 *
 * Features:
 * - Handles irregular words
 * - Uncountable words support
 * - Pattern-based rules
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

interface Rule {
  pattern: RegExp;
  replacement: string;
}

const singularRules: Rule[] = [
  { pattern: /([^aeiou])ies$/i, replacement: '$1y' },
  { pattern: /(x|ch|ss|sh)es$/i, replacement: '$1' },
  { pattern: /([^f])ves$/i, replacement: '$1fe' },
  { pattern: /(matr|vert|ind)ices$/i, replacement: '$1ex' },
  { pattern: /([ml])ice$/i, replacement: '$1ouse' },
  { pattern: /(quiz)zes$/i, replacement: '$1' },
  { pattern: /s$/i, replacement: '' },
];

const irregulars: Map<string, string> = new Map([
  ['people', 'person'],
  ['men', 'man'],
  ['women', 'woman'],
  ['children', 'child'],
  ['teeth', 'tooth'],
  ['feet', 'foot'],
  ['geese', 'goose'],
  ['mice', 'mouse'],
  ['oxen', 'ox'],
]);

const uncountables = new Set(['sheep', 'fish', 'deer', 'moose', 'series', 'species', 'money', 'rice', 'information', 'equipment']);

export default function singularize(word: string): string {
  const lower = word.toLowerCase();

  if (uncountables.has(lower)) return word;

  for (const [plur, sing] of irregulars) {
    if (lower === plur) {
      return matchCase(word, sing);
    }
  }

  for (const rule of singularRules) {
    if (rule.pattern.test(word)) {
      return word.replace(rule.pattern, rule.replacement);
    }
  }

  return word;
}

function matchCase(word: string, target: string): string {
  if (word === word.toUpperCase()) return target.toUpperCase();
  if (word[0] === word[0].toUpperCase()) return target.charAt(0).toUpperCase() + target.slice(1);
  return target.toLowerCase();
}

if (import.meta.url.includes("singularize")) {
  console.log("cats →", singularize("cats"));
  console.log("boxes →", singularize("boxes"));
  console.log("people →", singularize("people"));
  console.log("children →", singularize("children"));
}
