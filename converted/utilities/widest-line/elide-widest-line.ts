/**
 * Widest-Line - Get Widest Line
 *
 * Get the visual width of the widest line in a string.
 * **POLYGLOT SHOWCASE**: Widest line in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/widest-line (~20M+ downloads/week)
 *
 * Package has ~20M+ downloads/week on npm!
 */

import stringWidth from '../string-width/elide-string-width.ts';

export default function widestLine(text: string): number {
  const lines = text.split('\n');
  return Math.max(...lines.map(line => stringWidth(line)));
}

if (import.meta.url.includes("elide-widest-line.ts")) {
  console.log("📏 Widest-Line - Get Widest Line for Elide (POLYGLOT!)\n");

  const text = "Short\nMedium line\nThis is the longest line";
  console.log(`Widest: ${widestLine(text)}`);

  console.log("\n~20M+ downloads/week on npm!");
}
