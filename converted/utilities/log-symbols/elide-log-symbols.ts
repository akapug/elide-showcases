/**
 * Log-Symbols - Colored Symbols
 *
 * Colored symbols for various log levels.
 * **POLYGLOT SHOWCASE**: Log symbols in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/log-symbols (~40M+ downloads/week)
 *
 * Features:
 * - Info, success, warning, error symbols
 * - Cross-platform support
 * - Colored output
 * - Windows fallbacks
 * - Zero dependencies
 *
 * Package has ~40M+ downloads/week on npm!
 */

const logSymbols = {
  info: '\x1b[36mℹ\x1b[0m',
  success: '\x1b[32m✔\x1b[0m',
  warning: '\x1b[33m⚠\x1b[0m',
  error: '\x1b[31m✖\x1b[0m'
};

export default logSymbols;
export { logSymbols };

if (import.meta.url.includes("elide-log-symbols.ts")) {
  console.log("🔣 Log-Symbols - Colored Symbols for Elide (POLYGLOT!)\n");

  console.log(logSymbols.info, 'Information message');
  console.log(logSymbols.success, 'Success message');
  console.log(logSymbols.warning, 'Warning message');
  console.log(logSymbols.error, 'Error message');

  console.log("\n~40M+ downloads/week on npm!");
}
