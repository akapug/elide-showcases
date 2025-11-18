/**
 * Underscore.string - Comprehensive string manipulation utilities
 *
 * Features:
 * - Trim, strip, pad
 * - Truncate, capitalize
 * - Slugify, count
 * - And much more!
 *
 * Package has ~3M+ downloads/week on npm!
 */

export function capitalize(str: string, lowercaseRest: boolean = false): string {
  const rest = lowercaseRest ? str.slice(1).toLowerCase() : str.slice(1);
  return str.charAt(0).toUpperCase() + rest;
}

export function decapitalize(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

export function count(str: string, substr: string): number {
  if (!substr) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }
  return count;
}

export function truncate(str: string, length: number, truncateStr: string = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - truncateStr.length) + truncateStr;
}

export function prune(str: string, length: number, pruneStr: string = '...'): string {
  if (str.length <= length) return str;
  const pruned = str.slice(0, length);
  const lastSpace = pruned.lastIndexOf(' ');
  return (lastSpace > 0 ? pruned.slice(0, lastSpace) : pruned) + pruneStr;
}

export function repeat(str: string, count: number, separator: string = ''): string {
  return new Array(count + 1).join(str + separator).slice(0, -(separator.length || 1));
}

export function words(str: string, delimiter: RegExp | string = /\s+/): string[] {
  return str.trim().split(delimiter).filter(Boolean);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default {
  capitalize,
  decapitalize,
  reverse,
  count,
  truncate,
  prune,
  repeat,
  words,
  slugify,
};

if (import.meta.url.includes("underscore-string")) {
  console.log("capitalize:", capitalize("hello"));
  console.log("reverse:", reverse("hello"));
  console.log("count:", count("hello world", "l"));
  console.log("truncate:", truncate("hello world this is a test", 15));
  console.log("words:", words("hello world test"));
  console.log("slugify:", slugify("Hello World! This is a Test"));
}
