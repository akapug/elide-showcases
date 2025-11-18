/**
 * Redent - Re-indent Strings
 *
 * Remove redundant indentation and optionally indent with a different value.
 * **POLYGLOT SHOWCASE**: Re-indentation in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/redent (~15M+ downloads/week)
 *
 * Package has ~15M+ downloads/week on npm!
 */

import stripIndent from '../strip-indent/elide-strip-indent.ts';
import indentString from '../indent-string/elide-indent-string.ts';

export default function redent(text: string, count = 0, indent = ' '): string {
  const stripped = stripIndent(text);
  return count > 0 ? indentString(stripped, count, indent) : stripped;
}

if (import.meta.url.includes("elide-redent.ts")) {
  console.log("📝 Redent - Re-indent Strings for Elide (POLYGLOT!)\n");

  const text = "    Line 1\n    Line 2\n    Line 3";
  console.log(redent(text, 2));

  console.log("\n~15M+ downloads/week on npm!");
}
