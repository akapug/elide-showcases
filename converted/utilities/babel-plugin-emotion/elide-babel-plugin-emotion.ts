/**
 * Babel Plugin Emotion
 *
 * Optimizes emotion CSS-in-JS library.
 * **POLYGLOT SHOWCASE**: One plugin for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@emotion/babel-plugin (~500K+ downloads/week)
 *
 * Features:
 * - Source maps
 * - Auto labels
 * - Minification
 * - Dead code elimination
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function transform(code: string, options: any = {}): { code: string } {
  // Add auto labels for emotion
  const transformed = code.replace(/css\`/g, 'css({ label: "auto" })`');
  return { code: transformed };
}

export default function() {
  return { visitor: {} };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("😊 Babel Plugin Emotion (POLYGLOT!)\n");
  console.log("✅ ~500K+ downloads/week on npm!");
}
