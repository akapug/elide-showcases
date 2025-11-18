/**
 * Has Flag - Check CLI Flags
 *
 * Check if CLI flags are present.
 * **POLYGLOT SHOWCASE**: Flag checking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/has-flag (~20M+ downloads/week)
 *
 * Features:
 * - Check CLI flags
 * - Support -- and - prefixes
 * - Simple API
 * - Fast checking
 * - Zero dependencies
 *
 * Package has ~20M+ downloads/week on npm!
 */

export function hasFlag(flag: string, argv: string[] = process.argv): boolean {
  const prefix = flag.startsWith('-') ? '' : '--';
  const flagName = prefix + flag;

  return argv.includes(flagName);
}

export default hasFlag;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚩 Has Flag - Check CLI Flags (POLYGLOT!)\n");

  console.log("Has --verbose:", hasFlag('verbose'));
  console.log("Has --color:", hasFlag('color'));
  console.log("Has --help:", hasFlag('help'));

  console.log("\n🚀 ~20M+ downloads/week on npm!");
}
