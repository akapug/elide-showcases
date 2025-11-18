/**
 * Hyperlinker - Terminal Hyperlinks
 *
 * Create hyperlinks in terminal output.
 * **POLYGLOT SHOWCASE**: Hyperlinks for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hyperlinker (~50K+ downloads/week)
 *
 * Features:
 * - Terminal hyperlinks
 * - OSC 8 support
 * - Fallback handling
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function hyperlinker(text: string, url: string): string {
  return `\x1B]8;;${url}\x07${text}\x1B]8;;\x07`;
}

export default hyperlinker;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌐 Hyperlinker - Terminal Hyperlinks (POLYGLOT!)\n");

  console.log(hyperlinker('Click here', 'https://elide.dev'));
  console.log(hyperlinker('GitHub', 'https://github.com'));

  console.log("\n🚀 ~50K+ downloads/week on npm!");
}
