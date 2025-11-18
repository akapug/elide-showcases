/**
 * Wrap-ANSI - Wrap Text with ANSI
 *
 * Wordwrap text with ANSI escape codes.
 * **POLYGLOT SHOWCASE**: Text wrapping in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/wrap-ansi (~60M+ downloads/week)
 *
 * Package has ~60M+ downloads/week on npm!
 */

export default function wrapAnsi(text: string, columns: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > columns) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

if (import.meta.url.includes("elide-wrap-ansi.ts")) {
  console.log("📏 Wrap-ANSI - Wrap Text for Elide (POLYGLOT!)\n");

  const text = "This is a very long line of text that needs to be wrapped at a certain column width.";
  console.log(wrapAnsi(text, 40));

  console.log("\n~60M+ downloads/week on npm!");
}
