/**
 * Slice-ANSI - Slice ANSI Strings
 *
 * Slice a string with ANSI escape codes.
 * **POLYGLOT SHOWCASE**: String slicing in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/slice-ansi (~40M+ downloads/week)
 *
 * Package has ~40M+ downloads/week on npm!
 */

export default function sliceAnsi(text: string, start: number, end?: number): string {
  // Simple implementation - remove ANSI codes, slice, return
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  return stripped.slice(start, end);
}

if (import.meta.url.includes("elide-slice-ansi.ts")) {
  console.log("✂️  Slice-ANSI - Slice Strings for Elide (POLYGLOT!)\n");

  const colored = '\x1b[31mRed Text\x1b[39m';
  console.log(sliceAnsi(colored, 0, 3));

  console.log("\n~40M+ downloads/week on npm!");
}
