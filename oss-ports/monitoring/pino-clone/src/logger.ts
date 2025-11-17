/**
 * Pino Logger Implementation
 */

import type {
  LoggerOptions,
  Logger as ILogger,
  Bindings,
  LogObject,
  SerializerFn,
  LogFn,
} from './types';
import { levels } from './levels';

export class Logger implements ILogger {
  private _level: string | number;
  private _levelVal: number;
  private readonly options: Required<LoggerOptions>;
  private readonly stream: any;
  private readonly childBindings: Bindings;
  private readonly serializers: { [key: string]: SerializerFn };

  constructor(options: LoggerOptions = {}, stream: any = process.stdout) {
    this.options = this.normalizeOptions(options);
    this.stream = stream;
    this.childBindings = {};
    this.serializers = options.serializers || {};

    this._level = options.level || 'info';
    this._levelVal = this.getLevelValue(this._level);
  }

  get level(): string | number {
    return this._level;
  }

  set level(level: string | number) {
    this._level = level;
    this._levelVal = this.getLevelValue(level);
  }

  get levelVal(): number {
    return this._levelVal;
  }

  /**
   * Trace log
   */
  trace(obj: object, msg?: string, ...args: any[]): void;
  trace(msg: string, ...args: any[]): void;
  trace(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(10, objOrMsg, msg, ...args);
  }

  /**
   * Debug log
   */
  debug(obj: object, msg?: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
  debug(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(20, objOrMsg, msg, ...args);
  }

  /**
   * Info log
   */
  info(obj: object, msg?: string, ...args: any[]): void;
  info(msg: string, ...args: any[]): void;
  info(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(30, objOrMsg, msg, ...args);
  }

  /**
   * Warn log
   */
  warn(obj: object, msg?: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  warn(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(40, objOrMsg, msg, ...args);
  }

  /**
   * Error log
   */
  error(obj: object, msg?: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  error(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(50, objOrMsg, msg, ...args);
  }

  /**
   * Fatal log
   */
  fatal(obj: object, msg?: string, ...args: any[]): void;
  fatal(msg: string, ...args: any[]): void;
  fatal(objOrMsg: object | string, msg?: string, ...args: any[]): void {
    this.log(60, objOrMsg, msg, ...args);
  }

  /**
   * Create child logger
   */
  child(bindings: Bindings): Logger {
    const child = new Logger(this.options, this.stream);
    child.childBindings = { ...this.childBindings, ...bindings };

    if (this.options.onChild) {
      this.options.onChild(child);
    }

    return child;
  }

  /**
   * Get current bindings
   */
  bindings(): Bindings {
    return { ...this.childBindings };
  }

  /**
   * Check if level is enabled
   */
  isLevelEnabled(level: string | number): boolean {
    const levelVal = this.getLevelValue(level);
    return levelVal >= this._levelVal;
  }

  /**
   * Flush logs
   */
  flush(): void {
    // In real implementation, would flush async buffer
  }

  /**
   * Core log method
   */
  private log(
    level: number,
    objOrMsg: object | string,
    msg?: string,
    ...args: any[]
  ): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const logObj: LogObject = {
      level,
      time: Date.now(),
    };

    // Parse arguments
    let obj: object = {};
    let message: string = '';

    if (typeof objOrMsg === 'string') {
      message = objOrMsg;
      if (args.length > 0) {
        message = this.formatMessage(message, args);
      }
    } else {
      obj = objOrMsg;
      if (msg) {
        message = args.length > 0 ? this.formatMessage(msg, args) : msg;
      }
    }

    // Add bindings
    Object.assign(logObj, this.childBindings);

    // Apply serializers
    for (const [key, value] of Object.entries(obj)) {
      if (this.serializers[key]) {
        logObj[key] = this.serializers[key](value);
      } else {
        logObj[key] = value;
      }
    }

    // Add message
    if (message) {
      logObj[this.options.messageKey] = message;
    }

    // Apply redaction
    if (this.options.redact) {
      this.applyRedaction(logObj);
    }

    // Apply formatters
    if (this.options.formatters) {
      this.applyFormatters(logObj, level);
    }

    // Write to stream
    this.write(logObj);
  }

  /**
   * Write log object to stream
   */
  private write(logObj: LogObject): void {
    try {
      const json = JSON.stringify(logObj);
      const eol = this.options.crlf ? '\r\n' : '\n';
      this.stream.write(json + eol);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Format message with arguments
   */
  private formatMessage(msg: string, args: any[]): string {
    return msg.replace(/%[sdj]/g, (match) => {
      const arg = args.shift();

      if (match === '%s') {
        return String(arg);
      } else if (match === '%d') {
        return Number(arg).toString();
      } else if (match === '%j') {
        return JSON.stringify(arg);
      }

      return match;
    });
  }

  /**
   * Apply redaction to log object
   */
  private applyRedaction(logObj: LogObject): void {
    const redact = this.options.redact;

    if (Array.isArray(redact)) {
      for (const path of redact) {
        this.redactPath(logObj, path.split('.'));
      }
    } else if (typeof redact === 'object' && redact.paths) {
      for (const path of redact.paths) {
        this.redactPath(logObj, path.split('.'), redact.censor, redact.remove);
      }
    }
  }

  /**
   * Redact a specific path
   */
  private redactPath(
    obj: any,
    path: string[],
    censor: any = '[Redacted]',
    remove: boolean = false
  ): void {
    if (path.length === 0 || !obj || typeof obj !== 'object') {
      return;
    }

    const key = path[0];

    if (path.length === 1) {
      if (key in obj) {
        if (remove) {
          delete obj[key];
        } else {
          obj[key] = typeof censor === 'function' ? censor(obj[key], path) : censor;
        }
      }
    } else {
      if (key === '*') {
        // Wildcard redaction
        for (const prop in obj) {
          this.redactPath(obj[prop], path.slice(1), censor, remove);
        }
      } else if (key in obj) {
        this.redactPath(obj[key], path.slice(1), censor, remove);
      }
    }
  }

  /**
   * Apply formatters
   */
  private applyFormatters(logObj: LogObject, level: number): void {
    const formatters = this.options.formatters;

    if (formatters.level) {
      const label = levels.labels[level.toString()] || 'unknown';
      Object.assign(logObj, formatters.level(label, level));
    }

    if (formatters.bindings) {
      const bindings = formatters.bindings(this.childBindings);
      Object.assign(logObj, bindings);
    }

    if (formatters.log) {
      const formatted = formatters.log(logObj);
      Object.assign(logObj, formatted);
    }
  }

  /**
   * Get level numeric value
   */
  private getLevelValue(level: string | number): number {
    if (typeof level === 'number') {
      return level;
    }

    return levels.values[level] || 30; // Default to info
  }

  /**
   * Normalize options
   */
  private normalizeOptions(options: LoggerOptions): Required<LoggerOptions> {
    return {
      name: options.name || '',
      level: options.level || 'info',
      customLevels: options.customLevels || {},
      useOnlyCustomLevels: options.useOnlyCustomLevels || false,
      serializers: options.serializers || {},
      formatters: options.formatters || {},
      redact: options.redact || [],
      hooks: options.hooks || {},
      timestamp: options.timestamp !== false,
      messageKey: options.messageKey || 'msg',
      nestedKey: options.nestedKey || '',
      base: options.base !== undefined ? options.base : { pid: process.pid, hostname: require('os').hostname() },
      enabled: options.enabled !== false,
      crlf: options.crlf || false,
      prettyPrint: options.prettyPrint || false,
      onChild: options.onChild || (() => {}),
    };
  }
}

export type { LoggerOptions };
