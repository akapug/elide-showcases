/**
 * Titleize - Convert strings to Title Case
 *
 * Features:
 * - Capitalizes each word
 * - Handles multiple input formats
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export default function titleize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

if (import.meta.url.includes("titleize")) {
  console.log("hello world →", titleize("hello world"));
  console.log("helloWorld →", titleize("helloWorld"));
  console.log("foo_bar →", titleize("foo_bar"));
  console.log("test-case →", titleize("test-case"));
}
