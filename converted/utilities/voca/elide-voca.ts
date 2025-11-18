/**
 * Voca - Modern JavaScript string manipulation
 *
 * Features:
 * - Case manipulation
 * - Chop, cut, substring utilities
 * - Count, index utilities
 * - Escape, format utilities
 * - Query, test utilities
 * - Split, trim utilities
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

export function capitalize(str: string, allWords: boolean = false): string {
  if (allWords) {
    return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
}

export function snakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]+/g, '_').toLowerCase();
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

export function trim(str: string, chars?: string): string {
  if (!chars) return str.trim();
  const pattern = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
  return str.replace(pattern, '');
}

export function truncate(str: string, length: number, end: string = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - end.length) + end;
}

export function count(str: string): number {
  return str.length;
}

export function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'\/]/g, m => map[m]);
}

export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default {
  camelCase,
  capitalize,
  kebabCase,
  snakeCase,
  titleCase,
  trim,
  truncate,
  count,
  countWords,
  escapeHtml,
  reverse,
  slugify,
};

if (import.meta.url.includes("voca")) {
  console.log("camelCase:", camelCase("hello-world"));
  console.log("kebabCase:", kebabCase("helloWorld"));
  console.log("snakeCase:", snakeCase("helloWorld"));
  console.log("titleCase:", titleCase("hello world"));
  console.log("truncate:", truncate("hello world test", 10));
  console.log("slugify:", slugify("Hello World!"));
  console.log("countWords:", countWords("hello world test"));
}
