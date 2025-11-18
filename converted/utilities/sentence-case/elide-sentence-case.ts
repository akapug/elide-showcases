/**
 * Sentence Case - Convert strings to Sentence case
 *
 * Features:
 * - First word capitalized, rest lowercase
 * - Handles multiple input formats
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

export default function sentenceCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  return words[0][0].toUpperCase() + words[0].slice(1).toLowerCase() +
    (words.length > 1 ? ' ' + words.slice(1).map(w => w.toLowerCase()).join(' ') : '');
}

if (import.meta.url.includes("sentence-case")) {
  console.log("Sentence case:", sentenceCase("helloWorld"));
  console.log("Sentence case:", sentenceCase("FOO-BAR"));
  console.log("Sentence case:", sentenceCase("test_case_example"));
}
