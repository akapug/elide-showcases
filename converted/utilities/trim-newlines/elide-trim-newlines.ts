/**
 * Trim Newlines - Trim newlines from start and end
 *
 * Features:
 * - Trim newlines from start
 * - Trim newlines from end
 * - Trim from both
 * - Zero dependencies
 *
 * Package has ~30M+ downloads/week on npm!
 */

export default function trimNewlines(str: string): string {
  return str.replace(/^[\r\n]+|[\r\n]+$/g, '');
}

export function trimNewlinesStart(str: string): string {
  return str.replace(/^[\r\n]+/, '');
}

export function trimNewlinesEnd(str: string): string {
  return str.replace(/[\r\n]+$/, '');
}

if (import.meta.url.includes("trim-newlines")) {
  console.log("Trim both:", JSON.stringify(trimNewlines("\n\nhello\nworld\n\n")));
  console.log("Trim start:", JSON.stringify(trimNewlinesStart("\n\nhello\nworld\n\n")));
  console.log("Trim end:", JSON.stringify(trimNewlinesEnd("\n\nhello\nworld\n\n")));
}
