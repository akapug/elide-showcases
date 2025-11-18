/**
 * String-Width - Get String Width
 *
 * Get the visual width of a string (ANSI codes excluded).
 * **POLYGLOT SHOWCASE**: String width in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/string-width (~150M+ downloads/week)
 *
 * Package has ~150M+ downloads/week on npm!
 */

export default function stringWidth(text: string): number {
  // Strip ANSI codes and get length
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  return stripped.length;
}

if (import.meta.url.includes("elide-string-width.ts")) {
  console.log("📏 String-Width - Get String Width for Elide (POLYGLOT!)\n");

  const plain = "Hello";
  const colored = "\x1b[31mHello\x1b[39m";

  console.log(`Plain width: ${stringWidth(plain)}`);
  console.log(`Colored width: ${stringWidth(colored)}`);

  console.log("\n~150M+ downloads/week on npm!");
}
