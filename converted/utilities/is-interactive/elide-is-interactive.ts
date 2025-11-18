/**
 * Is Interactive - Detect Interactive Terminal
 *
 * Check if stdout is interactive.
 * **POLYGLOT SHOWCASE**: Terminal detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-interactive (~5M+ downloads/week)
 *
 * Features:
 * - Detect interactive terminals
 * - Check TTY status
 * - CI detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export function isInteractive(stream: NodeJS.WriteStream = process.stdout): boolean {
  return Boolean(
    stream.isTTY &&
    process.env.TERM !== 'dumb' &&
    !('CI' in process.env)
  );
}

export default isInteractive;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🖥️  Is Interactive - Terminal Detection (POLYGLOT!)\n");

  console.log("Is interactive:", isInteractive());
  console.log("Is TTY:", process.stdout.isTTY);
  console.log("In CI:", 'CI' in process.env);

  console.log("\n🚀 ~5M+ downloads/week on npm!");
}
