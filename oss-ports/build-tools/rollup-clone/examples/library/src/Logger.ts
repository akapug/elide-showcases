/**
 * Logger
 *
 * Simple logging library with levels and formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

export class Logger {
  private config: Required<LoggerConfig>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || 'info',
      prefix: config.prefix || '',
      timestamp: config.timestamp !== false,
      colors: config.colors !== false,
    };
  }

  /**
   * Debug log
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Info log
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Warning log
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Error log
   */
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Check if level is enabled
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    // Build log message
    const parts: string[] = [];

    // Add timestamp
    if (this.config.timestamp) {
      parts.push(`[${this.formatTimestamp()}]`);
    }

    // Add level
    const levelStr = level.toUpperCase();
    if (this.config.colors && typeof window === 'undefined') {
      parts.push(`${COLORS[level]}${levelStr}${COLORS.reset}`);
    } else {
      parts.push(levelStr);
    }

    // Add prefix
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    // Add message
    parts.push(message);

    // Build final message
    const finalMessage = parts.join(' ');

    // Log to console
    switch (level) {
      case 'debug':
        console.debug(finalMessage, ...args);
        break;
      case 'info':
        console.info(finalMessage, ...args);
        break;
      case 'warn':
        console.warn(finalMessage, ...args);
        break;
      case 'error':
        console.error(finalMessage, ...args);
        break;
    }
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Create child logger with prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }
}

/**
 * Create logger instance
 */
export function createLogger(config?: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Default logger instance
 */
export const logger = new Logger();
