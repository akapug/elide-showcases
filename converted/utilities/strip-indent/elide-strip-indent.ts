/**
 * Strip-Indent - Strip Indentation
 *
 * Strip leading indentation from each line in a string.
 * **POLYGLOT SHOWCASE**: Strip indentation in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/strip-indent (~30M+ downloads/week)
 *
 * Package has ~30M+ downloads/week on npm!
 */

export default function stripIndent(text: string): string {
  const lines = text.split('\n');
  const minIndent = lines
    .filter(line => line.trim())
    .map(line => line.match(/^\s*/)?.[0].length || 0)
    .reduce((min, indent) => Math.min(min, indent), Infinity);

  return lines.map(line => line.slice(minIndent)).join('\n');
}

if (import.meta.url.includes("elide-strip-indent.ts")) {
  console.log("📝 Strip-Indent - Strip Indentation for Elide (POLYGLOT!)\n");

  const text = "    Line 1\n    Line 2\n    Line 3";
  console.log(stripIndent(text));

  console.log("\n~30M+ downloads/week on npm!");
}
