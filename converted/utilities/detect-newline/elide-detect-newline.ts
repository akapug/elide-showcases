/**
 * Detect Newline - Detect newline type
 *
 * Features:
 * - Detects \n, \r\n, or \r
 * - Returns most common newline
 * - Zero dependencies
 *
 * Package has ~20M+ downloads/week on npm!
 */

export default function detectNewline(str: string): '\n' | '\r\n' | '\r' | undefined {
  if (!str) return undefined;

  const crlfCount = (str.match(/\r\n/g) || []).length;
  const lfCount = (str.match(/(?<!\r)\n/g) || []).length;
  const crCount = (str.match(/\r(?!\n)/g) || []).length;

  if (crlfCount > lfCount && crlfCount > crCount) {
    return '\r\n';
  }

  if (lfCount > crCount) {
    return '\n';
  }

  if (crCount > 0) {
    return '\r';
  }

  return undefined;
}

if (import.meta.url.includes("detect-newline")) {
  console.log("Unix (LF):", detectNewline("hello\nworld\ntest"));
  console.log("Windows (CRLF):", detectNewline("hello\r\nworld\r\ntest"));
  console.log("Old Mac (CR):", detectNewline("hello\rworld\rtest"));
  console.log("No newlines:", detectNewline("hello world"));
}
