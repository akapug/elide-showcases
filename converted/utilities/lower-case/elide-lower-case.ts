/**
 * Lower Case - Convert strings to lower case
 *
 * Features:
 * - Splits words intelligently
 * - Converts to lowercase with spaces
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

export default function lowerCase(str: string): string {
  return splitWords(str).map(w => w.toLowerCase()).join(' ');
}

if (import.meta.url.includes("lower-case")) {
  console.log("lower case:", lowerCase("helloWorld"));
  console.log("lower case:", lowerCase("FOO-BAR"));
  console.log("lower case:", lowerCase("Test_Case"));
}
