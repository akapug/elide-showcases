/**
 * Logger Service - Structured logging for edge functions
 *
 * Provides request logging, error tracking, and log aggregation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  requestId?: string;
  functionId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  console: boolean;
  file: boolean;
  filePath: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  structured: boolean;
}

export class Logger extends EventEmitter {
  private config: LoggerConfig;
  private buffer: LogEntry[];
  private currentFileSize: number;
  private fileRotationIndex: number;

  private static levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    super();

    this.config = {
      level: config.level || 'info',
      console: config.console !== false,
      file: config.file !== false,
      filePath: config.filePath || './logs/edge-compute.log',
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      structured: config.structured !== false,
    };

    this.buffer = [];
    this.currentFileSize = 0;
    this.fileRotationIndex = 0;

    this.initialize();
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: Partial<LogEntry> = { ...metadata };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.log('error', message, entry);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry: Partial<LogEntry> = { ...metadata };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    this.log('fatal', message, entry);
  }

  /**
   * Log a request
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.log('info', `${method} ${path} ${statusCode} ${duration}ms`, {
      ...metadata,
      type: 'request',
      method,
      path,
      statusCode,
      duration,
    });
  }

  /**
   * Log function execution
   */
  logExecution(
    functionId: string,
    functionName: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error';
    const status = success ? 'success' : 'failed';

    this.log(level, `Function ${functionName} ${status} in ${duration}ms`, {
      ...metadata,
      type: 'execution',
      functionId,
      functionName,
      success,
      duration,
    });
  }

  /**
   * Get recent logs
   */
  getRecent(limit: number = 100, filter?: { level?: LogLevel; functionId?: string }): LogEntry[] {
    let logs = [...this.buffer];

    if (filter?.level) {
      const minLevel = Logger.levels[filter.level];
      logs = logs.filter((log) => Logger.levels[log.level] >= minLevel);
    }

    if (filter?.functionId) {
      logs = logs.filter((log) => log.functionId === filter.functionId);
    }

    return logs.slice(-limit).reverse();
  }

  /**
   * Search logs
   */
  search(query: string, options?: { limit?: number; level?: LogLevel }): LogEntry[] {
    const limit = options?.limit || 100;
    let logs = [...this.buffer];

    // Filter by level
    if (options?.level) {
      const minLevel = Logger.levels[options.level];
      logs = logs.filter((log) => Logger.levels[log.level] >= minLevel);
    }

    // Search in message and metadata
    const filtered = logs.filter((log) => {
      if (log.message.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }

      if (log.metadata) {
        const metadataStr = JSON.stringify(log.metadata).toLowerCase();
        return metadataStr.includes(query.toLowerCase());
      }

      return false;
    });

    return filtered.slice(-limit).reverse();
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.buffer = [];
    this.emit('clear');
  }

  /**
   * Flush logs to disk
   */
  async flush(): Promise<void> {
    if (!this.config.file || this.buffer.length === 0) {
      return;
    }

    await this.writeToFile();
  }

  // Private methods

  private initialize(): void {
    // Create log directory
    if (this.config.file) {
      const dir = path.dirname(this.config.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Get current file size
      if (fs.existsSync(this.config.filePath)) {
        const stats = fs.statSync(this.config.filePath);
        this.currentFileSize = stats.size;
      }
    }

    // Flush buffer periodically
    setInterval(() => {
      this.flush().catch((err) => {
        console.error('Failed to flush logs:', err);
      });
    }, 5000); // Every 5 seconds
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Check if level is enabled
    if (Logger.levels[level] < Logger.levels[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      ...metadata,
    };

    // Add to buffer
    this.buffer.push(entry);

    // Keep only last 10000 entries in memory
    if (this.buffer.length > 10000) {
      this.buffer.shift();
    }

    // Emit event
    this.emit('log', entry);

    // Console output
    if (this.config.console) {
      this.writeToConsole(entry);
    }

    // File output (buffered, flushed periodically)
    // Actual write happens in flush()
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);

    let output: string;

    if (this.config.structured) {
      output = JSON.stringify({
        timestamp,
        level: entry.level,
        message: entry.message,
        ...entry.metadata,
        error: entry.error,
      });
    } else {
      output = `[${timestamp}] ${level} ${entry.message}`;

      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n${entry.error.stack}`;
        }
      }
    }

    // Use appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }

  private async writeToFile(): Promise<void> {
    if (this.buffer.length === 0) return;

    // Check if rotation is needed
    if (this.currentFileSize >= this.config.maxFileSize) {
      await this.rotateFile();
    }

    // Write buffered entries
    const lines = this.buffer.map((entry) => {
      if (this.config.structured) {
        return JSON.stringify({
          timestamp: entry.timestamp.toISOString(),
          level: entry.level,
          message: entry.message,
          ...entry.metadata,
          error: entry.error,
        });
      } else {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        return `[${timestamp}] ${level} ${entry.message}`;
      }
    });

    const content = lines.join('\n') + '\n';

    await fs.promises.appendFile(this.config.filePath, content, 'utf-8');
    this.currentFileSize += content.length;

    // Clear buffer after writing
    this.buffer = [];
  }

  private async rotateFile(): Promise<void> {
    // Rotate existing files
    for (let i = this.config.maxFiles - 1; i > 0; i--) {
      const oldPath = `${this.config.filePath}.${i}`;
      const newPath = `${this.config.filePath}.${i + 1}`;

      if (fs.existsSync(oldPath)) {
        await fs.promises.rename(oldPath, newPath);
      }
    }

    // Move current file to .1
    if (fs.existsSync(this.config.filePath)) {
      await fs.promises.rename(this.config.filePath, `${this.config.filePath}.1`);
    }

    // Delete oldest file if exceeds max
    const oldestPath = `${this.config.filePath}.${this.config.maxFiles}`;
    if (fs.existsSync(oldestPath)) {
      await fs.promises.unlink(oldestPath);
    }

    this.currentFileSize = 0;
    this.fileRotationIndex++;

    this.emit('rotate', { index: this.fileRotationIndex });
  }
}

export default Logger;
