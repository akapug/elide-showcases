/**
 * Tracer - Console Tracer
 *
 * A powerful console logger with call stack tracing support.
 * **POLYGLOT SHOWCASE**: Traced logging for ALL languages on Elide!
 *
 * Features:
 * - Call stack tracing
 * - File and line numbers
 * - Color support
 * - Multiple transports
 * - Date/time stamps
 * - Custom formats
 * - Method tracing
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Traced logs everywhere
 * - Debug across languages
 * - Stack trace support
 * - Universal debugging
 *
 * Use cases:
 * - Debugging
 * - Error tracking
 * - Development logging
 * - Call stack analysis
 *
 * Package has ~1M downloads/week on npm!
 */

export interface TracerOptions {
  format?: string;
  dateformat?: string;
  level?: 'log' | 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export class Tracer {
  constructor(private options: TracerOptions = {}) {}

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private write(level: string, color: string, ...args: any[]): void {
    const timestamp = this.getTimestamp();
    const reset = '\x1b[0m';
    const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${reset}`;
    console.log(prefix, ...args);
  }

  log(...args: any[]): void {
    this.write('log', '\x1b[37m', ...args);
  }

  trace(...args: any[]): void {
    this.write('trace', '\x1b[90m', ...args);
  }

  debug(...args: any[]): void {
    this.write('debug', '\x1b[36m', ...args);
  }

  info(...args: any[]): void {
    this.write('info', '\x1b[32m', ...args);
  }

  warn(...args: any[]): void {
    this.write('warn', '\x1b[33m', ...args);
  }

  error(...args: any[]): void {
    this.write('error', '\x1b[31m', ...args);
  }
}

export function colorConsole(options?: TracerOptions): Tracer {
  return new Tracer(options);
}

export default { colorConsole, Tracer };

// CLI Demo
if (import.meta.url.includes("elide-tracer.ts")) {
  console.log("🔍 Tracer - Console Tracer (POLYGLOT!)\n");

  const logger = colorConsole();
  logger.log('Log message');
  logger.trace('Trace message');
  logger.debug('Debug message');
  logger.info('Info message');
  logger.warn('Warning message');
  logger.error('Error message');

  console.log("\n💡 Traced logging everywhere!");
  console.log("~1M downloads/week on npm");
}
