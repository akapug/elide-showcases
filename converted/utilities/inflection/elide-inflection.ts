/**
 * Inflection - String inflections (pluralize, singularize, etc.)
 *
 * Features:
 * - Pluralize words
 * - Singularize words
 * - Ordinalize numbers
 * - Dasherize strings
 * - Underscore strings
 * - Humanize strings
 *
 * Package has ~8M+ downloads/week on npm!
 */

const pluralRules: Array<[RegExp, string]> = [
  [/s$/i, 's'],
  [/([^aeiou])y$/i, '$1ies'],
  [/(x|ch|ss|sh)$/i, '$1es'],
  [/$/i, 's'],
];

const singularRules: Array<[RegExp, string]> = [
  [/([^aeiou])ies$/i, '$1y'],
  [/(x|ch|ss|sh)es$/i, '$1'],
  [/s$/i, ''],
];

export function pluralize(word: string): string {
  for (const [pattern, replacement] of pluralRules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }
  return word;
}

export function singularize(word: string): string {
  for (const [pattern, replacement] of singularRules) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }
  return word;
}

export function ordinalize(number: number): string {
  const absNumber = Math.abs(number);
  const mod100 = absNumber % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${number}th`;
  }

  switch (absNumber % 10) {
    case 1: return `${number}st`;
    case 2: return `${number}nd`;
    case 3: return `${number}rd`;
    default: return `${number}th`;
  }
}

export function dasherize(str: string): string {
  return str.replace(/_/g, '-');
}

export function underscore(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
}

export function humanize(str: string): string {
  return str
    .replace(/_id$/, '')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
}

export function camelize(str: string, uppercaseFirstLetter: boolean = true): string {
  if (uppercaseFirstLetter) {
    return str.replace(/(?:^|[-_])(\w)/g, (_, c) => c ? c.toUpperCase() : '');
  } else {
    return str.replace(/[-_](\w)/g, (_, c) => c ? c.toUpperCase() : '');
  }
}

export default {
  pluralize,
  singularize,
  ordinalize,
  dasherize,
  underscore,
  humanize,
  camelize,
};

if (import.meta.url.includes("inflection")) {
  console.log("Pluralize:", pluralize("cat"), pluralize("box"));
  console.log("Singularize:", singularize("cats"), singularize("boxes"));
  console.log("Ordinalize:", ordinalize(1), ordinalize(2), ordinalize(3), ordinalize(4));
  console.log("Dasherize:", dasherize("hello_world"));
  console.log("Underscore:", underscore("HelloWorld"));
  console.log("Humanize:", humanize("user_id"), humanize("first_name"));
  console.log("Camelize:", camelize("hello_world"), camelize("hello_world", false));
}
