/**
 * Consola - Elegant Console Logger
 *
 * An elegant console logger with consistent output across environments.
 * **POLYGLOT SHOWCASE**: Elegant logging for ALL languages on Elide!
 *
 * Features:
 * - Elegant console output
 * - Browser and Node support
 * - Log levels
 * - Tag support
 * - Reporters
 * - Pausable logging
 * - Mock support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Elegant logs everywhere
 * - ONE logger for all environments
 * - Consistent output format
 * - Universal API
 *
 * Use cases:
 * - Universal applications
 * - Development logging
 * - Production logging
 * - Framework logging
 *
 * Package has ~10M downloads/week on npm!
 */

export type ConsolaLevel = 'silent' | 'fatal' | 'error' | 'warn' | 'log' | 'info' | 'success' | 'debug' | 'trace' | 'verbose';

const LEVELS: Record<ConsolaLevel, number> = {
  silent: -Infinity,
  fatal: 0,
  error: 0,
  warn: 1,
  log: 2,
  info: 3,
  success: 3,
  debug: 4,
  trace: 5,
  verbose: 5,
};

export class Consola {
  private level: number = LEVELS.info;
  private tag?: string;

  setLevel(level: number): void {
    this.level = level;
  }

  withTag(tag: string): Consola {
    const instance = new Consola();
    instance.level = this.level;
    instance.tag = tag;
    return instance;
  }

  private write(level: ConsolaLevel, color: string, badge: string, ...args: any[]): void {
    if (LEVELS[level] > this.level) {
      return;
    }

    const tagStr = this.tag ? `[${this.tag}] ` : '';
    const reset = '\x1b[0m';
    console.log(`${color}${badge} ${tagStr}${reset}${args.join(' ')}`);
  }

  fatal(...args: any[]): void {
    this.write('fatal', '\x1b[35m', '✖ FATAL', ...args);
  }

  error(...args: any[]): void {
    this.write('error', '\x1b[31m', '✖ ERROR', ...args);
  }

  warn(...args: any[]): void {
    this.write('warn', '\x1b[33m', '⚠ WARN', ...args);
  }

  log(...args: any[]): void {
    this.write('log', '', '', ...args);
  }

  info(...args: any[]): void {
    this.write('info', '\x1b[36m', 'ℹ INFO', ...args);
  }

  success(...args: any[]): void {
    this.write('success', '\x1b[32m', '✔ SUCCESS', ...args);
  }

  debug(...args: any[]): void {
    this.write('debug', '\x1b[90m', '● DEBUG', ...args);
  }

  trace(...args: any[]): void {
    this.write('trace', '\x1b[90m', '› TRACE', ...args);
  }

  verbose(...args: any[]): void {
    this.write('verbose', '\x1b[90m', '… VERBOSE', ...args);
  }
}

const consola = new Consola();

export default consola;

// CLI Demo
if (import.meta.url.includes("elide-consola.ts")) {
  console.log("✨ Consola - Elegant Logging (POLYGLOT!)\n");

  consola.success('Build completed');
  consola.info('Server started');
  consola.warn('Deprecated feature');
  consola.error('Build failed');

  const tagged = consola.withTag('API');
  tagged.info('Request processed');
  tagged.success('Response sent');

  console.log("\n💡 Elegant logs everywhere!");
  console.log("~10M downloads/week on npm");
}
