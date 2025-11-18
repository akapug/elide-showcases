/**
 * Capital Case - Convert strings to Capital Case
 *
 * Features:
 * - All words capitalized with spaces
 * - Handles multiple input formats
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

export default function capitalCase(str: string): string {
  return splitWords(str).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

if (import.meta.url.includes("capital-case")) {
  console.log("Capital Case:", capitalCase("helloWorld"));
  console.log("Capital Case:", capitalCase("foo-bar"));
  console.log("Capital Case:", capitalCase("test_case"));
}
