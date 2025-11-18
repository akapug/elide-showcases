/**
 * ANSI-Escapes - ANSI Escape Codes
 *
 * ANSI escape codes for manipulating the terminal.
 * **POLYGLOT SHOWCASE**: ANSI escapes in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/ansi-escapes (~50M+ downloads/week)
 *
 * Features:
 * - Cursor movement
 * - Screen manipulation
 * - Erase operations
 * - Link support
 * - Image support
 * - Zero dependencies
 *
 * Package has ~50M+ downloads/week on npm!
 */

export const ansiEscapes = {
  cursorTo: (x: number, y?: number) => y !== undefined ? `\x1b[${y + 1};${x + 1}H` : `\x1b[${x + 1}G`,
  cursorMove: (x: number, y?: number) => {
    let result = '';
    if (x < 0) result += `\x1b[${-x}D`;
    else if (x > 0) result += `\x1b[${x}C`;
    if (y && y < 0) result += `\x1b[${-y}A`;
    else if (y && y > 0) result += `\x1b[${y}B`;
    return result;
  },
  cursorUp: (count = 1) => `\x1b[${count}A`,
  cursorDown: (count = 1) => `\x1b[${count}B`,
  cursorForward: (count = 1) => `\x1b[${count}C`,
  cursorBackward: (count = 1) => `\x1b[${count}D`,
  cursorLeft: `\x1b[G`,
  cursorSavePosition: '\x1b7',
  cursorRestorePosition: '\x1b8',
  cursorGetPosition: '\x1b[6n',
  cursorNextLine: `\x1b[E`,
  cursorPrevLine: `\x1b[F`,
  cursorHide: `\x1b[?25l`,
  cursorShow: `\x1b[?25h`,
  eraseLines: (count: number) => {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += `\x1b[2K${i < count - 1 ? '\x1b[1A' : ''}`;
    }
    return result;
  },
  eraseEndLine: `\x1b[K`,
  eraseStartLine: `\x1b[1K`,
  eraseLine: `\x1b[2K`,
  eraseDown: `\x1b[J`,
  eraseUp: `\x1b[1J`,
  eraseScreen: `\x1b[2J`,
  scrollUp: `\x1b[S`,
  scrollDown: `\x1b[T`,
  clearScreen: '\x1b[2J\x1b[3J\x1b[H',
  clearTerminal: process.platform === 'win32' ? '\x1b[2J\x1b[0f' : '\x1b[2J\x1b[3J\x1b[H',
  beep: '\x07',
  link: (text: string, url: string) => `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`,
  image: (buffer: Buffer, options?: { width?: number; height?: number }) => {
    const {width = 80, height = 24} = options || {};
    return `\x1b]1337;File=inline=1;width=${width};height=${height}:${buffer.toString('base64')}\x07`;
  }
};

export default ansiEscapes;

if (import.meta.url.includes("elide-ansi-escapes.ts")) {
  console.log("🎨 ANSI-Escapes - ANSI Escape Codes for Elide (POLYGLOT!)\n");

  console.log("Cursor movement:");
  console.log(ansiEscapes.cursorUp(2) + "Moved up 2 lines");
  console.log(ansiEscapes.cursorDown(1) + "Moved down 1 line");

  console.log("\nScreen manipulation:");
  console.log(ansiEscapes.clearScreen);

  console.log("\n~50M+ downloads/week on npm!");
}
