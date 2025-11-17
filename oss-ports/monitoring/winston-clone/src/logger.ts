/**
 * Winston Logger Implementation
 */

import type {
  LoggerOptions,
  LogEntry,
  Transport,
  Levels,
  Format,
  QueryOptions,
  ProfileResult,
} from './types';
import { npmLevels } from './config';

export class Logger {
  public level: string;
  public levels: Levels;
  public format?: Format;
  public defaultMeta: any;
  public transports: Transport[];
  public exitOnError: boolean;
  public silent: boolean;
  public exceptionHandlers: Transport[];
  public rejectionHandlers: Transport[];

  private profiles: Map<string, { start: number; meta?: any }> = new Map();

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.levels = options.levels || npmLevels;
    this.format = options.format;
    this.defaultMeta = options.defaultMeta || {};
    this.transports = options.transports || [];
    this.exitOnError = options.exitOnError !== false;
    this.silent = options.silent || false;
    this.exceptionHandlers = options.exceptionHandlers || [];
    this.rejectionHandlers = options.rejectionHandlers || [];

    // Setup exception handling
    if (this.exceptionHandlers.length > 0) {
      this.setupExceptionHandlers();
    }

    // Setup rejection handling
    if (this.rejectionHandlers.length > 0) {
      this.setupRejectionHandlers();
    }

    // Create level methods
    this.createLevelMethods();
  }

  /**
   * Log a message
   */
  log(level: string, message: string, ...meta: any[]): this;
  log(entry: LogEntry): this;
  log(levelOrEntry: string | LogEntry, message?: string, ...meta: any[]): this {
    if (this.silent) {
      return this;
    }

    let entry: LogEntry;

    if (typeof levelOrEntry === 'string') {
      entry = {
        level: levelOrEntry,
        message: message || '',
        ...this.mergeMeta(meta),
      };
    } else {
      entry = levelOrEntry;
    }

    // Add default meta
    entry = { ...this.defaultMeta, ...entry };

    // Check level
    if (!this.isLevelEnabled(entry.level)) {
      return this;
    }

    // Apply format
    if (this.format) {
      const formatted = this.format.transform(entry);
      if (!formatted) {
        return this;
      }
      entry = formatted;
    }

    // Write to transports
    this.write(entry);

    return this;
  }

  /**
   * Create a child logger
   */
  child(defaultMeta: any): Logger {
    const child = new Logger({
      level: this.level,
      levels: this.levels,
      format: this.format,
      defaultMeta: { ...this.defaultMeta, ...defaultMeta },
      transports: this.transports,
      exitOnError: this.exitOnError,
      silent: this.silent,
    });

    return child;
  }

  /**
   * Add a transport
   */
  add(transport: Transport): this {
    this.transports.push(transport);
    return this;
  }

  /**
   * Remove a transport
   */
  remove(transport: Transport): this {
    const index = this.transports.indexOf(transport);
    if (index !== -1) {
      this.transports.splice(index, 1);
    }
    return this;
  }

  /**
   * Clear all transports
   */
  clear(): this {
    this.transports = [];
    return this;
  }

  /**
   * Close all transports
   */
  close(): void {
    for (const transport of this.transports) {
      if (transport.close) {
        transport.close();
      }
    }
  }

  /**
   * Start profiling
   */
  profile(id: string, meta?: any): this {
    const existing = this.profiles.get(id);

    if (existing) {
      // End profiling
      const duration = Date.now() - existing.start;
      this.profiles.delete(id);

      this.log('info', id, {
        ...existing.meta,
        ...meta,
        durationMs: duration,
      });
    } else {
      // Start profiling
      this.profiles.set(id, {
        start: Date.now(),
        meta,
      });
    }

    return this;
  }

  /**
   * Query logs
   */
  query(options: QueryOptions, callback?: (err: Error | null, results?: any[]) => void): Promise<any[]> {
    const promise = new Promise<any[]>((resolve, reject) => {
      // Would query transports that support querying
      const results: any[] = [];
      resolve(results);
    });

    if (callback) {
      promise.then(
        (results) => callback(null, results),
        (err) => callback(err)
      );
    }

    return promise;
  }

  /**
   * Query logs (async)
   */
  async queryAsync(options: QueryOptions): Promise<any[]> {
    return this.query(options);
  }

  /**
   * Check if level is enabled
   */
  private isLevelEnabled(level: string): boolean {
    const levelValue = this.levels[level];
    const currentLevelValue = this.levels[this.level];

    if (levelValue === undefined || currentLevelValue === undefined) {
      return true;
    }

    return levelValue <= currentLevelValue;
  }

  /**
   * Write entry to transports
   */
  private write(entry: LogEntry): void {
    let pending = this.transports.length;
    const done = () => {
      pending--;
    };

    for (const transport of this.transports) {
      if (transport.silent) {
        done();
        continue;
      }

      if (transport.level && !this.isTransportLevelEnabled(entry.level, transport.level)) {
        done();
        continue;
      }

      const transportEntry = { ...entry };

      // Apply transport format
      if (transport.format) {
        const formatted = transport.format.transform(transportEntry);
        if (!formatted) {
          done();
          continue;
        }
        Object.assign(transportEntry, formatted);
      }

      transport.log(transportEntry, done);
    }
  }

  /**
   * Check if transport level is enabled
   */
  private isTransportLevelEnabled(entryLevel: string, transportLevel: string): boolean {
    const entryValue = this.levels[entryLevel];
    const transportValue = this.levels[transportLevel];

    if (entryValue === undefined || transportValue === undefined) {
      return true;
    }

    return entryValue <= transportValue;
  }

  /**
   * Merge metadata
   */
  private mergeMeta(meta: any[]): any {
    if (meta.length === 0) {
      return {};
    }

    if (meta.length === 1 && typeof meta[0] === 'object') {
      return meta[0];
    }

    return Object.assign({}, ...meta);
  }

  /**
   * Create level methods
   */
  private createLevelMethods(): void {
    for (const level of Object.keys(this.levels)) {
      (this as any)[level] = (message: string, ...meta: any[]) => {
        return this.log(level, message, ...meta);
      };
    }
  }

  /**
   * Setup exception handlers
   */
  private setupExceptionHandlers(): void {
    const handler = (error: Error) => {
      const entry: LogEntry = {
        level: 'error',
        message: 'uncaughtException: ' + (error.message || 'Unknown error'),
        error: {
          message: error.message,
          stack: error.stack,
          ...error,
        },
        timestamp: new Date().toISOString(),
      };

      // Write to exception handlers
      for (const transport of this.exceptionHandlers) {
        transport.log(entry, () => {});
      }

      if (!this.exitOnError) {
        process.exit(1);
      }
    };

    process.on('uncaughtException', handler);
  }

  /**
   * Setup rejection handlers
   */
  private setupRejectionHandlers(): void {
    const handler = (reason: any) => {
      const entry: LogEntry = {
        level: 'error',
        message: 'unhandledRejection: ' + (reason?.message || String(reason)),
        error: {
          message: reason?.message,
          stack: reason?.stack,
          ...reason,
        },
        timestamp: new Date().toISOString(),
      };

      // Write to rejection handlers
      for (const transport of this.rejectionHandlers) {
        transport.log(entry, () => {});
      }

      if (!this.exitOnError) {
        process.exit(1);
      }
    };

    process.on('unhandledRejection', handler);
  }
}
