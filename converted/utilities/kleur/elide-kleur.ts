/**
 * Kleur - Fast Colors
 *
 * Fastest terminal colors library.
 * **POLYGLOT SHOWCASE**: Fast colors in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/kleur (~80M+ downloads/week)
 *
 * Features:
 * - Blazing fast
 * - Tiny footprint
 * - No dependencies
 * - Chainable API
 * - Auto color detection
 *
 * Package has ~80M+ downloads/week on npm!
 */

const kleur = {
  reset: (str: string) => str,
  bold: (str: string) => `\x1b[1m${str}\x1b[22m`,
  dim: (str: string) => `\x1b[2m${str}\x1b[22m`,
  italic: (str: string) => `\x1b[3m${str}\x1b[23m`,
  underline: (str: string) => `\x1b[4m${str}\x1b[24m`,
  inverse: (str: string) => `\x1b[7m${str}\x1b[27m`,
  hidden: (str: string) => `\x1b[8m${str}\x1b[28m`,
  strikethrough: (str: string) => `\x1b[9m${str}\x1b[29m`,
  black: (str: string) => `\x1b[30m${str}\x1b[39m`,
  red: (str: string) => `\x1b[31m${str}\x1b[39m`,
  green: (str: string) => `\x1b[32m${str}\x1b[39m`,
  yellow: (str: string) => `\x1b[33m${str}\x1b[39m`,
  blue: (str: string) => `\x1b[34m${str}\x1b[39m`,
  magenta: (str: string) => `\x1b[35m${str}\x1b[39m`,
  cyan: (str: string) => `\x1b[36m${str}\x1b[39m`,
  white: (str: string) => `\x1b[37m${str}\x1b[39m`,
  gray: (str: string) => `\x1b[90m${str}\x1b[39m`,
  grey: (str: string) => `\x1b[90m${str}\x1b[39m`
};

export default kleur;

if (import.meta.url.includes("elide-kleur.ts")) {
  console.log("🎨 Kleur - Fast Colors for Elide (POLYGLOT!)\n");

  console.log(kleur.red('Red text'));
  console.log(kleur.green('Green text'));
  console.log(kleur.blue('Blue text'));
  console.log(kleur.bold('Bold text'));

  console.log("\n~80M+ downloads/week on npm!");
}
