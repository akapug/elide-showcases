/**
 * Upper Case - Convert strings to UPPER CASE
 *
 * Features:
 * - Splits words intelligently
 * - Converts to uppercase with spaces
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

export default function upperCase(str: string): string {
  return splitWords(str).map(w => w.toUpperCase()).join(' ');
}

if (import.meta.url.includes("upper-case")) {
  console.log("UPPER CASE:", upperCase("helloWorld"));
  console.log("UPPER CASE:", upperCase("foo-bar"));
  console.log("UPPER CASE:", upperCase("test_case"));
}
