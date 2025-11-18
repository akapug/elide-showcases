/**
 * Param Case - Convert strings to param-case
 *
 * Features:
 * - Lowercase with hyphens
 * - Perfect for URL parameters
 * - Zero dependencies
 *
 * Package has ~15M+ downloads/week on npm!
 */

function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

export default function paramCase(str: string): string {
  return splitWords(str).map(w => w.toLowerCase()).join('-');
}

if (import.meta.url.includes("param-case")) {
  console.log("param-case:", paramCase("helloWorld"));
  console.log("param-case:", paramCase("foo_bar"));
  console.log("param-case:", paramCase("Test Case"));
}
