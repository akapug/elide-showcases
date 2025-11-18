/**
 * Constant Case - Convert strings to CONSTANT_CASE
 *
 * Features:
 * - Uppercase with underscores
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

export default function constantCase(str: string): string {
  return splitWords(str).map(w => w.toUpperCase()).join('_');
}

if (import.meta.url.includes("constant-case")) {
  console.log("CONSTANT_CASE:", constantCase("helloWorld"));
  console.log("CONSTANT_CASE:", constantCase("foo-bar"));
  console.log("CONSTANT_CASE:", constantCase("test case"));
}
