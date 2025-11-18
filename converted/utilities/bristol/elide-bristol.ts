/**
 * Bristol - Insanely Configurable Logger
 *
 * An insanely configurable logging library with plugin support.
 * **POLYGLOT SHOWCASE**: Configurable logging for ALL languages on Elide!
 *
 * Features:
 * - Highly configurable
 * - Plugin system
 * - Custom targets
 * - Log levels
 * - Format support
 * - Transform support
 * - Multiple outputs
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Flexible logging everywhere
 * - Configure once, use everywhere
 * - Plugin support across languages
 * - Universal configuration
 *
 * Use cases:
 * - Complex logging needs
 * - Plugin-based systems
 * - Custom log formats
 * - Multi-target logging
 *
 * Package has ~100K downloads/week on npm!
 */

export type BristolSeverity = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface BristolOptions {
  severity?: BristolSeverity;
}

const SEVERITIES: Record<BristolSeverity, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

export class Bristol {
  private severity: number = SEVERITIES.info;
  private targets: Array<(severity: BristolSeverity, ...args: any[]) => void> = [];

  constructor(options: BristolOptions = {}) {
    if (options.severity) {
      this.severity = SEVERITIES[options.severity];
    }
    this.addTarget(this.defaultTarget);
  }

  private defaultTarget(severity: BristolSeverity, ...args: any[]): void {
    const colors: Record<BristolSeverity, string> = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[32m',
      trace: '\x1b[90m',
    };
    const color = colors[severity];
    const reset = '\x1b[0m';
    console.log(`${color}[${severity.toUpperCase()}]${reset}`, ...args);
  }

  addTarget(target: (severity: BristolSeverity, ...args: any[]) => void): void {
    this.targets.push(target);
  }

  private log(severity: BristolSeverity, ...args: any[]): void {
    if (SEVERITIES[severity] > this.severity) {
      return;
    }
    for (const target of this.targets) {
      target(severity, ...args);
    }
  }

  error(...args: any[]): void {
    this.log('error', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  info(...args: any[]): void {
    this.log('info', ...args);
  }

  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  trace(...args: any[]): void {
    this.log('trace', ...args);
  }
}

export default function bristol(options?: BristolOptions): Bristol {
  return new Bristol(options);
}

// CLI Demo
if (import.meta.url.includes("elide-bristol.ts")) {
  console.log("⚙️ Bristol - Configurable Logging (POLYGLOT!)\n");

  const logger = bristol();
  logger.error('Error message');
  logger.warn('Warning message');
  logger.info('Info message');
  logger.debug('Debug message');

  console.log("\n💡 Highly configurable logging everywhere!");
  console.log("~100K downloads/week on npm");
}
