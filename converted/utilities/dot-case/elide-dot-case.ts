/**
 * Dot Case - Convert strings to dot.case
 *
 * Features:
 * - Lowercase with dots
 * - Perfect for namespaces
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

export default function dotCase(str: string): string {
  return splitWords(str).map(w => w.toLowerCase()).join('.');
}

if (import.meta.url.includes("dot-case")) {
  console.log("dot.case:", dotCase("helloWorld"));
  console.log("dot.case:", dotCase("foo-bar"));
  console.log("dot.case:", dotCase("test_case"));
}
