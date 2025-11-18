/**
 * Colorette - Lightweight Terminal Colors
 *
 * Tiny and fast terminal colors library.
 * **POLYGLOT SHOWCASE**: Terminal colors for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/colorette (~5M+ downloads/week)
 *
 * Features:
 * - Tiny footprint
 * - Fast performance
 * - Auto color detection
 * - All ANSI colors
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

const enabled = !(process.env.NO_COLOR || process.argv.includes('--no-color'));

const createColors = (enabled: boolean) => {
  const applyColor = (code: number, close: number) => (str: string) =>
    enabled ? `\x1b[${code}m${str}\x1b[${close}m` : str;

  return {
    reset: applyColor(0, 0),
    bold: applyColor(1, 22),
    dim: applyColor(2, 22),
    italic: applyColor(3, 23),
    underline: applyColor(4, 24),
    inverse: applyColor(7, 27),
    hidden: applyColor(8, 28),
    strikethrough: applyColor(9, 29),
    black: applyColor(30, 39),
    red: applyColor(31, 39),
    green: applyColor(32, 39),
    yellow: applyColor(33, 39),
    blue: applyColor(34, 39),
    magenta: applyColor(35, 39),
    cyan: applyColor(36, 39),
    white: applyColor(37, 39),
    gray: applyColor(90, 39),
    bgBlack: applyColor(40, 49),
    bgRed: applyColor(41, 49),
    bgGreen: applyColor(42, 49),
    bgYellow: applyColor(43, 49),
    bgBlue: applyColor(44, 49),
    bgMagenta: applyColor(45, 49),
    bgCyan: applyColor(46, 49),
    bgWhite: applyColor(47, 49),
  };
};

export const colorette = createColors(enabled);

export const {
  reset,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
  bgWhite,
} = colorette;

export default colorette;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 Colorette - Terminal Colors (POLYGLOT!)\n");

  console.log(red("Red text"));
  console.log(green("Green text"));
  console.log(blue("Blue text"));
  console.log(bold("Bold text"));
  console.log(underline("Underlined text"));

  console.log("\n🚀 ~5M+ downloads/week on npm!");
}
