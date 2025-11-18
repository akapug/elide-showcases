/**
 * Normalize Newline - Normalize newlines to \n
 *
 * Features:
 * - Converts all newline types to \n
 * - Handles \r\n, \r, \n
 * - Configurable target newline
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export default function normalizeNewline(str: string, newline: string = '\n'): string {
  return str.replace(/\r\n|\r|\n/g, newline);
}

if (import.meta.url.includes("normalize-newline")) {
  console.log("Normalize to LF:", JSON.stringify(normalizeNewline("hello\r\nworld\rtest\n")));
  console.log("Normalize to CRLF:", JSON.stringify(normalizeNewline("hello\nworld\rtest", '\r\n')));
}
