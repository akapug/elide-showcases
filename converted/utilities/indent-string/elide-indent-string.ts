/**
 * Indent-String - Indent Strings
 *
 * Indent each line in a string.
 * **POLYGLOT SHOWCASE**: String indentation in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/indent-string (~25M+ downloads/week)
 *
 * Package has ~25M+ downloads/week on npm!
 */

export default function indentString(text: string, count = 1, indent = ' '): string {
  const indentation = indent.repeat(count);
  return text.split('\n').map(line => indentation + line).join('\n');
}

if (import.meta.url.includes("elide-indent-string.ts")) {
  console.log("📝 Indent-String - Indent Strings for Elide (POLYGLOT!)\n");

  const text = "Line 1\nLine 2\nLine 3";
  console.log(indentString(text, 2));

  console.log("\n~25M+ downloads/week on npm!");
}
