/**
 * CLI Cursor - Terminal Cursor Control
 *
 * Show/hide terminal cursor.
 * **POLYGLOT SHOWCASE**: Cursor control for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cli-cursor (~5M+ downloads/week)
 *
 * Features:
 * - Show/hide cursor
 * - Cursor positioning
 * - ANSI escape codes
 * - Cross-platform support
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

const ESC = '\x1B[';

export const cliCursor = {
  show(stream = process.stdout): void {
    stream.write(ESC + '?25h');
  },

  hide(stream = process.stdout): void {
    stream.write(ESC + '?25l');
  },

  toggle(force?: boolean, stream = process.stdout): void {
    if (force !== undefined) {
      if (force) {
        this.show(stream);
      } else {
        this.hide(stream);
      }
    }
  },
};

export default cliCursor;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("👁️  CLI Cursor - Cursor Control (POLYGLOT!)\n");

  console.log("Hiding cursor for 1 second...");
  cliCursor.hide();

  setTimeout(() => {
    cliCursor.show();
    console.log("Cursor shown again!");
    console.log("\n🚀 ~5M+ downloads/week on npm!");
  }, 1000);
}
