/**
 * Colors - Terminal string styling (alternative to chalk)
 * Based on https://www.npmjs.com/package/colors (~6M downloads/week)
 */

const styles: Record<string, [number, number]> = {
  bold: [1, 22],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39]
};

function colorize(text: string, style: string): string {
  const [open, close] = styles[style] || [0, 0];
  return `\x1b[${open}m${text}\x1b[${close}m`;
}

// Add methods to String prototype (colors.js style)
declare global {
  interface String {
    red: string;
    green: string;
    yellow: string;
    blue: string;
    bold: string;
  }
}

export const red = (text: string) => colorize(text, 'red');
export const green = (text: string) => colorize(text, 'green');
export const yellow = (text: string) => colorize(text, 'yellow');
export const blue = (text: string) => colorize(text, 'blue');
export const bold = (text: string) => colorize(text, 'bold');

export default { red, green, yellow, blue, bold };

if (import.meta.url.includes("colors.ts")) {
  console.log("🎨 Colors - Terminal styling for Elide\n");
  console.log(red("Red text"));
  console.log(green("Green text"));
  console.log(yellow("Yellow text"));
  console.log(bold("Bold text"));
  console.log("\n~6M+ downloads/week on npm!");
}
