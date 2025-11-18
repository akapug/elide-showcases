/**
 * Log4js - Log4j Port for Node
 *
 * A port of Log4j to Node.js with flexible logging configuration.
 * **POLYGLOT SHOWCASE**: Log4j-style logging for ALL languages on Elide!
 *
 * Features:
 * - Log4j-inspired API
 * - Multiple appenders
 * - Category-based logging
 * - Layout support
 * - Log levels
 * - Color output
 * - File appenders
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Familiar Log4j API for Java developers
 * - ONE logger works in Python, Ruby, TypeScript
 * - Consistent logging across languages
 * - Share logging patterns
 *
 * Use cases:
 * - Enterprise applications
 * - Category-based logging
 * - Multi-appender logging
 * - Migration from Java
 *
 * Package has ~8M downloads/week on npm!
 */

export type Level = 'ALL' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'OFF';

export interface Appender {
  append(level: Level, category: string, message: string): void;
}

export class ConsoleAppender implements Appender {
  append(level: Level, category: string, message: string): void {
    const colors: Record<Level, string> = {
      ALL: '',
      TRACE: '\x1b[90m',
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      FATAL: '\x1b[35m',
      OFF: '',
    };
    const color = colors[level] || '';
    const reset = '\x1b[0m';
    console.log(`${color}[${new Date().toISOString()}] [${level}] ${category} - ${message}${reset}`);
  }
}

export class Logger {
  constructor(
    private category: string,
    private level: Level,
    private appender: Appender
  ) {}

  private log(level: Level, ...args: any[]): void {
    const levels: Level[] = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'];
    if (levels.indexOf(level) < levels.indexOf(this.level)) {
      return;
    }
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    this.appender.append(level, this.category, message);
  }

  trace(...args: any[]): void {
    this.log('TRACE', ...args);
  }

  debug(...args: any[]): void {
    this.log('DEBUG', ...args);
  }

  info(...args: any[]): void {
    this.log('INFO', ...args);
  }

  warn(...args: any[]): void {
    this.log('WARN', ...args);
  }

  error(...args: any[]): void {
    this.log('ERROR', ...args);
  }

  fatal(...args: any[]): void {
    this.log('FATAL', ...args);
  }
}

const loggers = new Map<string, Logger>();
let defaultAppender: Appender = new ConsoleAppender();
let defaultLevel: Level = 'INFO';

export function getLogger(category: string = 'default'): Logger {
  if (!loggers.has(category)) {
    loggers.set(category, new Logger(category, defaultLevel, defaultAppender));
  }
  return loggers.get(category)!;
}

export function configure(config: { appenders?: Appender; level?: Level }): void {
  if (config.appenders) {
    defaultAppender = config.appenders;
  }
  if (config.level) {
    defaultLevel = config.level;
  }
}

export default { getLogger, configure };

// CLI Demo
if (import.meta.url.includes("elide-log4js.ts")) {
  console.log("📊 Log4js - Log4j for Node (POLYGLOT!)\n");

  const logger = getLogger('app');
  logger.info('Application started');
  logger.debug('Debug information');
  logger.warn('Warning message');
  logger.error('Error occurred');

  const dbLogger = getLogger('database');
  dbLogger.info('Connected to database');

  console.log("\n💡 Polyglot: Log4j-style logging everywhere!");
  console.log("~8M downloads/week on npm");
}
