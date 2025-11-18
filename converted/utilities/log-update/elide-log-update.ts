/**
 * Log-Update - Log Overwriting
 *
 * Log by overwriting the previous output in the terminal.
 * **POLYGLOT SHOWCASE**: Log overwriting in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/log-update (~15M+ downloads/week)
 *
 * Features:
 * - Overwrite previous log
 * - Multiple line support
 * - Restore cursor position
 * - Perfect for progress indicators
 * - Zero dependencies
 *
 * Package has ~15M+ downloads/week on npm!
 */

let previousLineCount = 0;

function logUpdate(...args: any[]): void {
  const output = args.join(' ');
  const lines = output.split('\n');

  // Clear previous lines
  if (previousLineCount > 0) {
    process.stdout.write('\x1b[' + previousLineCount + 'A');
    process.stdout.write('\x1b[0J');
  }

  console.log(output);
  previousLineCount = lines.length;
}

logUpdate.clear = function(): void {
  if (previousLineCount > 0) {
    process.stdout.write('\x1b[' + previousLineCount + 'A');
    process.stdout.write('\x1b[0J');
    previousLineCount = 0;
  }
};

logUpdate.done = function(): void {
  previousLineCount = 0;
};

export default logUpdate;

if (import.meta.url.includes("elide-log-update.ts")) {
  console.log("📝 Log-Update - Log Overwriting for Elide (POLYGLOT!)\n");

  let i = 0;
  const interval = setInterval(() => {
    logUpdate(`Frame ${i}`);
    i++;
    if (i === 10) {
      clearInterval(interval);
      logUpdate.done();
    }
  }, 100);

  console.log("\n~15M+ downloads/week on npm!");
}
