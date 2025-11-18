/**
 * Path Case - Convert strings to path/case
 *
 * Features:
 * - Lowercase with slashes
 * - Perfect for file paths
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

export default function pathCase(str: string): string {
  return splitWords(str).map(w => w.toLowerCase()).join('/');
}

if (import.meta.url.includes("path-case")) {
  console.log("path/case:", pathCase("helloWorld"));
  console.log("path/case:", pathCase("foo-bar"));
  console.log("path/case:", pathCase("test_case"));
}
