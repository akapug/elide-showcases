/**
 * Signale - Hackable Console Logger
 *
 * A highly configurable console logger with beautiful output.
 * **POLYGLOT SHOWCASE**: Beautiful logging for ALL languages on Elide!
 *
 * Features:
 * - Beautiful console output
 * - Custom loggers
 * - Scoped loggers
 * - Icons and badges
 * - Color support
 * - Success/error indicators
 * - Timer support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Beautiful logs everywhere
 * - ONE logger for all languages
 * - Consistent visual feedback
 * - Perfect for CLI tools
 *
 * Use cases:
 * - CLI applications
 * - Build tools
 * - Development logging
 * - User-facing logs
 *
 * Package has ~3M downloads/week on npm!
 */

export interface SignaleOptions {
  scope?: string;
  types?: Record<string, { badge: string; color: string; label: string }>;
}

export class Signale {
  private scope?: string;

  constructor(options: SignaleOptions = {}) {
    this.scope = options.scope;
  }

  private format(badge: string, color: string, label: string, ...args: any[]): void {
    const scopeStr = this.scope ? `[${this.scope}] ` : '';
    const reset = '\x1b[0m';
    console.log(`${color}${badge} ${label}${reset} ${scopeStr}${args.join(' ')}`);
  }

  success(...args: any[]): void {
    this.format('✔', '\x1b[32m', 'success', ...args);
  }

  error(...args: any[]): void {
    this.format('✖', '\x1b[31m', 'error', ...args);
  }

  warn(...args: any[]): void {
    this.format('⚠', '\x1b[33m', 'warning', ...args);
  }

  info(...args: any[]): void {
    this.format('ℹ', '\x1b[36m', 'info', ...args);
  }

  debug(...args: any[]): void {
    this.format('●', '\x1b[35m', 'debug', ...args);
  }

  log(...args: any[]): void {
    this.format('', '', '', ...args);
  }

  start(...args: any[]): void {
    this.format('◆', '\x1b[34m', 'start', ...args);
  }

  complete(...args: any[]): void {
    this.format('☑', '\x1b[32m', 'complete', ...args);
  }

  pending(...args: any[]): void {
    this.format('…', '\x1b[36m', 'pending', ...args);
  }

  scope(name: string): Signale {
    return new Signale({ scope: name });
  }

  time(label: string): void {
    console.time(label);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
  }
}

const signale = new Signale();

export default signale;

// CLI Demo
if (import.meta.url.includes("elide-signale.ts")) {
  console.log("🎨 Signale - Beautiful Logging (POLYGLOT!)\n");

  signale.success('Operation completed');
  signale.error('Something went wrong');
  signale.warn('Deprecated API');
  signale.info('Information');
  signale.start('Starting process');
  signale.complete('Process finished');

  const scoped = signale.scope('API');
  scoped.info('Request received');
  scoped.success('Response sent');

  console.log("\n💡 Beautiful logs everywhere!");
  console.log("~3M downloads/week on npm");
}
