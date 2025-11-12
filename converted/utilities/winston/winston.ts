/**
 * Winston - Universal logging library
 * Based on https://www.npmjs.com/package/winston (~14M downloads/week)
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: any;
}

class Logger {
  private level: LogLevel = 'info';
  private levels = { error: 0, warn: 1, info: 2, debug: 3 };

  constructor(options?: { level?: LogLevel }) {
    if (options?.level) this.level = options.level;
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (this.levels[level] > this.levels[this.level]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };

    const color = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m'
    }[level];

    console.log(`${color}[${entry.timestamp}] ${level.toUpperCase()}\x1b[0m: ${message}`,
      metadata ? metadata : '');
  }

  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }
}

export function createLogger(options?: { level?: LogLevel }): Logger {
  return new Logger(options);
}

export default { createLogger };

if (import.meta.url.includes("winston.ts")) {
  console.log("📝 Winston - Universal logging for Elide\n");
  const logger = createLogger({ level: 'debug' });
  logger.error('This is an error');
  logger.warn('This is a warning');
  logger.info('This is info');
  logger.debug('This is debug');
  console.log("\n~14M+ downloads/week on npm!");
}
