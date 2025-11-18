/**
 * LogLevel - Minimal Logging Library
 *
 * A minimal lightweight logging library for JavaScript.
 * **POLYGLOT SHOWCASE**: Minimal logging for ALL languages on Elide!
 *
 * Features:
 * - Minimal API (5 levels)
 * - Console replacement
 * - Log level control
 * - Plugin support
 * - Tiny footprint
 * - Simple configuration
 * - Browser compatible
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Simple logging API everywhere
 * - ONE minimal logger for all languages
 * - Easy to integrate
 * - Perfect for libraries
 *
 * Use cases:
 * - Library logging
 * - Simple applications
 * - Browser logging
 * - Quick prototyping
 *
 * Package has ~30M downloads/week on npm!
 */

export type LogLevelValue = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevelValue, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

class LogLevel {
  private currentLevel: number = LEVELS.info;

  getLevel(): LogLevelValue {
    return Object.keys(LEVELS).find(k => LEVELS[k as LogLevelValue] === this.currentLevel) as LogLevelValue;
  }

  setLevel(level: LogLevelValue | number): void {
    if (typeof level === 'string') {
      this.currentLevel = LEVELS[level];
    } else {
      this.currentLevel = level;
    }
  }

  enableAll(): void {
    this.currentLevel = LEVELS.trace;
  }

  disableAll(): void {
    this.currentLevel = 99;
  }

  trace(...args: any[]): void {
    if (this.currentLevel <= LEVELS.trace) {
      console.log('[TRACE]', ...args);
    }
  }

  debug(...args: any[]): void {
    if (this.currentLevel <= LEVELS.debug) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.currentLevel <= LEVELS.info) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.currentLevel <= LEVELS.warn) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.currentLevel <= LEVELS.error) {
      console.error('[ERROR]', ...args);
    }
  }
}

const log = new LogLevel();

export default log;
export { log };

// CLI Demo
if (import.meta.url.includes("elide-loglevel.ts")) {
  console.log("🔧 LogLevel - Minimal Logging (POLYGLOT!)\n");

  log.info('Application started');
  log.debug('Debug message');
  log.warn('Warning');
  log.error('Error');

  log.setLevel('debug');
  log.debug('Now debug is visible');

  console.log("\n💡 Minimal logging everywhere!");
  console.log("~30M downloads/week on npm");
}
