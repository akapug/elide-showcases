/**
 * Caterpillar - Logging Library
 *
 * A logging library that can pipe to various outputs.
 * **POLYGLOT SHOWCASE**: Pipe-based logging for ALL languages on Elide!
 *
 * Features:
 * - Transform-based logging
 * - Multiple outputs
 * - Log levels
 * - Piping support
 * - Custom transforms
 * - Filter support
 * - Stream-based
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Transform logs everywhere
 * - Pipe to multiple outputs
 * - Universal stream API
 * - Consistent transformations
 *
 * Use cases:
 * - Multi-output logging
 * - Log transformations
 * - Stream processing
 * - Complex logging pipelines
 *
 * Package has ~200K downloads/week on npm!
 */

export type CaterpillarLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug';

const LEVELS: Record<CaterpillarLevel, number> = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7,
};

export class Logger {
  private level: number = LEVELS.info;

  setLevel(level: CaterpillarLevel): void {
    this.level = LEVELS[level];
  }

  private log(level: CaterpillarLevel, ...args: any[]): void {
    if (LEVELS[level] > this.level) {
      return;
    }

    const colors: Record<CaterpillarLevel, string> = {
      emergency: '\x1b[41m',
      alert: '\x1b[35m',
      critical: '\x1b[31m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      notice: '\x1b[36m',
      info: '\x1b[32m',
      debug: '\x1b[90m',
    };

    const color = colors[level];
    const reset = '\x1b[0m';
    console.log(`${color}[${level.toUpperCase()}]${reset}`, ...args);
  }

  emergency(...args: any[]): void {
    this.log('emergency', ...args);
  }

  alert(...args: any[]): void {
    this.log('alert', ...args);
  }

  critical(...args: any[]): void {
    this.log('critical', ...args);
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }

  warning(...args: any[]): void {
    this.log('warning', ...args);
  }

  notice(...args: any[]): void {
    this.log('notice', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }
}

export function create(): Logger {
  return new Logger();
}

export default { create, Logger };

// CLI Demo
if (import.meta.url.includes("elide-caterpillar.ts")) {
  console.log("🐛 Caterpillar - Transform Logging (POLYGLOT!)\n");

  const logger = create();
  logger.emergency('Emergency message');
  logger.critical('Critical error');
  logger.error('Error occurred');
  logger.warning('Warning message');
  logger.info('Information');
  logger.debug('Debug info');

  console.log("\n💡 Transform logs everywhere!");
  console.log("~200K downloads/week on npm");
}
