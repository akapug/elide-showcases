/**
 * Fancy Log - Fancy Logging
 *
 * A lightweight logger with timestamp and color support.
 * **POLYGLOT SHOWCASE**: Fancy logging for ALL languages on Elide!
 *
 * Features:
 * - Timestamped logs
 * - Color support
 * - Simple API
 * - Format strings
 * - Lightweight
 * - Drop-in console replacement
 * - Gulp compatible
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Fancy logs everywhere
 * - ONE logger for build tools
 * - Consistent timestamps
 * - Universal API
 *
 * Use cases:
 * - Build tools
 * - Task runners
 * - CLI applications
 * - Development logging
 *
 * Package has ~15M downloads/week on npm!
 */

function getTimestamp(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function fancyLog(...args: any[]): void {
  const timestamp = `\x1b[90m[${getTimestamp()}]\x1b[0m`;
  console.log(timestamp, ...args);
}

fancyLog.info = function(...args: any[]): void {
  const timestamp = `\x1b[90m[${getTimestamp()}]\x1b[0m`;
  const badge = '\x1b[36mℹ\x1b[0m';
  console.log(timestamp, badge, ...args);
};

fancyLog.warn = function(...args: any[]): void {
  const timestamp = `\x1b[90m[${getTimestamp()}]\x1b[0m`;
  const badge = '\x1b[33m⚠\x1b[0m';
  console.log(timestamp, badge, ...args);
};

fancyLog.error = function(...args: any[]): void {
  const timestamp = `\x1b[90m[${getTimestamp()}]\x1b[0m`;
  const badge = '\x1b[31m✖\x1b[0m';
  console.log(timestamp, badge, ...args);
};

export default fancyLog;

// CLI Demo
if (import.meta.url.includes("elide-fancy-log.ts")) {
  console.log("🎭 Fancy Log - Timestamped Logging (POLYGLOT!)\n");

  fancyLog('Starting build process');
  fancyLog.info('Compiling sources');
  fancyLog.warn('Source maps disabled');
  fancyLog.error('Build failed');

  console.log("\n💡 Fancy logs everywhere!");
  console.log("~15M downloads/week on npm");
}
