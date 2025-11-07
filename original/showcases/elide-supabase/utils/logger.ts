/**
 * Logging Utility
 *
 * Provides structured logging with different levels and outputs
 */

import { LogConfig, LogEntry } from '../types';

/**
 * Logger class
 */
export class Logger {
  private config: LogConfig;
  private logLevel: number;

  private static readonly LEVELS: Record<string, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(config: LogConfig) {
    this.config = config;
    this.logLevel = Logger.LEVELS[config.level] || Logger.LEVELS.info;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= Logger.LEVELS.debug) {
      this.log('debug', message, args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= Logger.LEVELS.info) {
      this.log('info', message, args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= Logger.LEVELS.warn) {
      this.log('warn', message, args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: any[]): void {
    if (this.logLevel <= Logger.LEVELS.error) {
      this.log('error', message, args);
    }
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, args: any[]): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: args.length > 0 ? this.formatArgs(args) : undefined
    };

    // Format based on config
    const formatted = this.config.format === 'json'
      ? this.formatJSON(entry)
      : this.formatText(entry);

    // Output based on config
    this.output(formatted, level);
  }

  /**
   * Format log entry as JSON
   */
  private formatJSON(entry: LogEntry): string {
    return JSON.stringify({
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp.toISOString(),
      ...entry.context
    });
  }

  /**
   * Format log entry as text
   */
  private formatText(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    return `[${timestamp}] ${level} ${entry.message}${context}`;
  }

  /**
   * Format arguments
   */
  private formatArgs(args: any[]): Record<string, any> {
    const context: Record<string, any> = {};

    args.forEach((arg, i) => {
      if (arg instanceof Error) {
        context.error = {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        };
      } else if (typeof arg === 'object') {
        Object.assign(context, arg);
      } else {
        context[`arg${i}`] = arg;
      }
    });

    return context;
  }

  /**
   * Output log message
   */
  private output(message: string, level: string): void {
    switch (this.config.output) {
      case 'console':
        this.outputConsole(message, level);
        break;

      case 'file':
        this.outputFile(message);
        break;

      case 'both':
        this.outputConsole(message, level);
        this.outputFile(message);
        break;
    }
  }

  /**
   * Output to console
   */
  private outputConsole(message: string, level: string): void {
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'debug':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }

  /**
   * Output to file
   */
  private outputFile(message: string): void {
    if (!this.config.file) {
      return;
    }

    // In real implementation, would append to file:
    // const fs = require('fs');
    // fs.appendFileSync(this.config.file, message + '\n');

    // For now, just log that we would write to file
    // (to avoid actual file I/O in this showcase)
  }

  /**
   * Create child logger with context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);

    // Override log method to include context
    const originalLog = childLogger['log'].bind(childLogger);
    childLogger['log'] = (level: string, message: string, args: any[]) => {
      originalLog(level, message, [context, ...args]);
    };

    return childLogger;
  }
}
