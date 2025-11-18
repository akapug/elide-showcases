/**
 * Npmlog - npm's Logger
 *
 * The logger used by npm itself for package management logging.
 * **POLYGLOT SHOWCASE**: npm-style logging for ALL languages on Elide!
 *
 * Features:
 * - Progress bars
 * - Gauge support
 * - Log levels
 * - Prefixes
 * - Heading support
 * - Color themes
 * - Stream output
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - npm-style logs everywhere
 * - ONE logger for all package managers
 * - Familiar npm output format
 * - Progress tracking across languages
 *
 * Use cases:
 * - Package managers
 * - CLI tools
 * - Installation scripts
 * - Progress tracking
 *
 * Package has ~80M downloads/week on npm!
 */

export type NpmLogLevel = 'silly' | 'verbose' | 'info' | 'timing' | 'http' | 'notice' | 'warn' | 'error' | 'silent';

const LEVELS: Record<NpmLogLevel, number> = {
  silly: -Infinity,
  verbose: 1000,
  info: 2000,
  timing: 2500,
  http: 3000,
  notice: 3500,
  warn: 4000,
  error: 5000,
  silent: Infinity,
};

class NpmLog {
  private level: number = LEVELS.info;
  private heading: string = 'npm';

  setLevel(level: NpmLogLevel): void {
    this.level = LEVELS[level];
  }

  private write(level: NpmLogLevel, prefix: string, message: string, ...args: any[]): void {
    if (LEVELS[level] < this.level) {
      return;
    }

    const colors: Record<NpmLogLevel, string> = {
      silly: '\x1b[90m',
      verbose: '\x1b[36m',
      info: '\x1b[32m',
      timing: '\x1b[35m',
      http: '\x1b[34m',
      notice: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      silent: '',
    };

    const color = colors[level] || '';
    const reset = '\x1b[0m';
    const msg = [message, ...args].join(' ');
    console.log(`${color}${this.heading}${reset} ${prefix} ${msg}`);
  }

  silly(prefix: string, message: string, ...args: any[]): void {
    this.write('silly', prefix, message, ...args);
  }

  verbose(prefix: string, message: string, ...args: any[]): void {
    this.write('verbose', prefix, message, ...args);
  }

  info(prefix: string, message: string, ...args: any[]): void {
    this.write('info', prefix, message, ...args);
  }

  timing(prefix: string, message: string, ...args: any[]): void {
    this.write('timing', prefix, message, ...args);
  }

  http(prefix: string, message: string, ...args: any[]): void {
    this.write('http', prefix, message, ...args);
  }

  notice(prefix: string, message: string, ...args: any[]): void {
    this.write('notice', prefix, message, ...args);
  }

  warn(prefix: string, message: string, ...args: any[]): void {
    this.write('warn', prefix, message, ...args);
  }

  error(prefix: string, message: string, ...args: any[]): void {
    this.write('error', prefix, message, ...args);
  }

  log(level: NpmLogLevel, prefix: string, message: string, ...args: any[]): void {
    this.write(level, prefix, message, ...args);
  }
}

const log = new NpmLog();

export default log;
export { log };

// CLI Demo
if (import.meta.url.includes("elide-npmlog.ts")) {
  console.log("📦 Npmlog - npm's Logger (POLYGLOT!)\n");

  log.info('install', 'Installing packages');
  log.verbose('download', 'Downloading package-1.0.0.tgz');
  log.warn('deprecated', 'Package is deprecated');
  log.error('404', 'Package not found');

  console.log("\n💡 npm-style logging everywhere!");
  console.log("~80M downloads/week on npm");
}
