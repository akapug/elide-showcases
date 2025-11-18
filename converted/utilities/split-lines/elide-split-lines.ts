/**
 * Split Lines - Split string into lines
 *
 * Features:
 * - Handles all newline types
 * - Preserves trailing newlines
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export default function splitLines(str: string, options: { preserveNewlines?: boolean } = {}): string[] {
  if (options.preserveNewlines) {
    return str.split(/(\r\n|\r|\n)/);
  }
  return str.split(/\r\n|\r|\n/);
}

if (import.meta.url.includes("split-lines")) {
  const text = "hello\nworld\r\ntest\rend";
  console.log("Split lines:", splitLines(text));
  console.log("Preserve newlines:", splitLines(text, { preserveNewlines: true }));
}
