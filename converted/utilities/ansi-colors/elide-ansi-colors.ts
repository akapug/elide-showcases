/**
 * ANSI-Colors - ANSI Coloring
 *
 * Fast ANSI colors for the terminal.
 * **POLYGLOT SHOWCASE**: ANSI colors in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/ansi-colors (~30M+ downloads/week)
 *
 * Package has ~30M+ downloads/week on npm!
 */

const colors = {
  black: (str: string) => `\x1b[30m${str}\x1b[39m`,
  red: (str: string) => `\x1b[31m${str}\x1b[39m`,
  green: (str: string) => `\x1b[32m${str}\x1b[39m`,
  yellow: (str: string) => `\x1b[33m${str}\x1b[39m`,
  blue: (str: string) => `\x1b[34m${str}\x1b[39m`,
  magenta: (str: string) => `\x1b[35m${str}\x1b[39m`,
  cyan: (str: string) => `\x1b[36m${str}\x1b[39m`,
  white: (str: string) => `\x1b[37m${str}\x1b[39m`,
  gray: (str: string) => `\x1b[90m${str}\x1b[39m`,
  bold: (str: string) => `\x1b[1m${str}\x1b[22m`,
  dim: (str: string) => `\x1b[2m${str}\x1b[22m`,
  italic: (str: string) => `\x1b[3m${str}\x1b[23m`,
  underline: (str: string) => `\x1b[4m${str}\x1b[24m`
};

export default colors;

if (import.meta.url.includes("elide-ansi-colors.ts")) {
  console.log("🎨 ANSI-Colors - ANSI Coloring for Elide (POLYGLOT!)\n");

  console.log(colors.red('Red text'));
  console.log(colors.green('Green text'));
  console.log(colors.blue('Blue text'));
  console.log(colors.bold('Bold text'));

  console.log("\n~30M+ downloads/week on npm!");
}
