/**
 * CLI Boxes - Terminal Box Borders
 *
 * Box border styles for terminal output.
 * **POLYGLOT SHOWCASE**: Terminal boxes for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cli-boxes (~2M+ downloads/week)
 *
 * Features:
 * - Multiple box styles
 * - Single/double borders
 * - Rounded corners
 * - ASCII fallbacks
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export interface BoxStyle {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

export const cliBoxes: Record<string, BoxStyle> = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
  },
  classic: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
  },
};

export default cliBoxes;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 CLI Boxes - Terminal Borders (POLYGLOT!)\n");

  Object.entries(cliBoxes).forEach(([name, style]) => {
    console.log(`${name}:`);
    console.log(style.topLeft + style.horizontal.repeat(10) + style.topRight);
    console.log(style.vertical + ' '.repeat(10) + style.vertical);
    console.log(style.bottomLeft + style.horizontal.repeat(10) + style.bottomRight);
    console.log();
  });

  console.log("🚀 ~2M+ downloads/week on npm!");
}
