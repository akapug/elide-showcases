/**
 * Winston Transports
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  Transport,
  LogEntry,
  ConsoleTransportOptions,
  FileTransportOptions,
  HttpTransportOptions,
  StreamTransportOptions,
} from './types';

/**
 * Console transport
 */
export class Console implements Transport {
  public level?: string;
  public silent: boolean;
  public format?: any;
  public handleExceptions: boolean;
  public handleRejections: boolean;
  private stderrLevels: string[];
  private consoleWarnLevels: string[];
  private eol: string;

  constructor(options: ConsoleTransportOptions = {}) {
    this.level = options.level;
    this.silent = options.silent || false;
    this.format = options.format;
    this.handleExceptions = options.handleExceptions || false;
    this.handleRejections = options.handleRejections || false;
    this.stderrLevels = options.stderrLevels || ['error'];
    this.consoleWarnLevels = options.consoleWarnLevels || [];
    this.eol = options.eol || '\n';
  }

  log(info: LogEntry, callback: () => void): void {
    setImmediate(() => {
      const output = this.format ? this.formatMessage(info) : this.defaultFormat(info);

      if (this.stderrLevels.includes(info.level)) {
        process.stderr.write(output + this.eol);
      } else if (this.consoleWarnLevels.includes(info.level)) {
        console.warn(output);
      } else {
        process.stdout.write(output + this.eol);
      }

      callback();
    });
  }

  private formatMessage(info: LogEntry): string {
    return typeof info === 'string' ? info : JSON.stringify(info);
  }

  private defaultFormat(info: LogEntry): string {
    const { level, message, timestamp, ...meta } = info;
    let output = `${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }

    return output;
  }
}

/**
 * File transport
 */
export class File implements Transport {
  public level?: string;
  public silent: boolean;
  public format?: any;
  public handleExceptions: boolean;
  public handleRejections: boolean;

  private filename: string;
  private dirname: string;
  private maxsize?: number;
  private maxFiles?: number;
  private tailable: boolean;
  private currentSize: number = 0;
  private stream?: fs.WriteStream;

  constructor(options: FileTransportOptions) {
    this.level = options.level;
    this.silent = options.silent || false;
    this.format = options.format;
    this.handleExceptions = options.handleExceptions || false;
    this.handleRejections = options.handleRejections || false;

    this.filename = options.filename;
    this.dirname = options.dirname || path.dirname(this.filename);
    this.maxsize = options.maxsize;
    this.maxFiles = options.maxFiles;
    this.tailable = options.tailable || false;

    this.openStream();
  }

  log(info: LogEntry, callback: () => void): void {
    setImmediate(() => {
      if (!this.stream) {
        this.openStream();
      }

      const output = this.format ? this.formatMessage(info) : JSON.stringify(info);
      const message = output + '\n';

      this.stream!.write(message, () => {
        this.currentSize += Buffer.byteLength(message);

        if (this.maxsize && this.currentSize >= this.maxsize) {
          this.rotateFile();
        }

        callback();
      });
    });
  }

  close(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = undefined;
    }
  }

  private openStream(): void {
    const fullPath = path.resolve(this.dirname, this.filename);
    const dirname = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    this.stream = fs.createWriteStream(fullPath, { flags: 'a' });

    // Get current file size
    try {
      const stats = fs.statSync(fullPath);
      this.currentSize = stats.size;
    } catch (err) {
      this.currentSize = 0;
    }
  }

  private rotateFile(): void {
    if (this.stream) {
      this.stream.end();
    }

    const fullPath = path.resolve(this.dirname, this.filename);

    // Rotate files
    if (this.maxFiles) {
      for (let i = this.maxFiles - 1; i >= 0; i--) {
        const oldFile = i === 0 ? fullPath : `${fullPath}.${i}`;
        const newFile = `${fullPath}.${i + 1}`;

        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
    }

    this.openStream();
  }

  private formatMessage(info: LogEntry): string {
    return typeof info === 'string' ? info : JSON.stringify(info);
  }
}

/**
 * HTTP transport
 */
export class Http implements Transport {
  public level?: string;
  public silent: boolean;
  public format?: any;
  public handleExceptions: boolean;
  public handleRejections: boolean;

  private host: string;
  private port: number;
  private path: string;
  private auth?: { username: string; password: string };
  private ssl: boolean;
  private batch: boolean;
  private batchInterval: number;
  private batchCount: number;
  private buffer: LogEntry[] = [];
  private timer?: NodeJS.Timeout;

  constructor(options: HttpTransportOptions = {}) {
    this.level = options.level;
    this.silent = options.silent || false;
    this.format = options.format;
    this.handleExceptions = options.handleExceptions || false;
    this.handleRejections = options.handleRejections || false;

    this.host = options.host || 'localhost';
    this.port = options.port || 80;
    this.path = options.path || '/';
    this.auth = options.auth;
    this.ssl = options.ssl || false;
    this.batch = options.batch || false;
    this.batchInterval = options.batchInterval || 5000;
    this.batchCount = options.batchCount || 10;

    if (this.batch) {
      this.startBatchTimer();
    }
  }

  log(info: LogEntry, callback: () => void): void {
    if (this.batch) {
      this.buffer.push(info);

      if (this.buffer.length >= this.batchCount) {
        this.flush();
      }

      callback();
    } else {
      this.send([info], callback);
    }
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.buffer.length > 0) {
      this.flush();
    }
  }

  private startBatchTimer(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.batchInterval);
  }

  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const logs = this.buffer.splice(0);
    this.send(logs, () => {});
  }

  private async send(logs: LogEntry[], callback: () => void): Promise<void> {
    const url = `${this.ssl ? 'https' : 'http'}://${this.host}:${this.port}${this.path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.auth) {
      const credentials = Buffer.from(
        `${this.auth.username}:${this.auth.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(logs),
      });

      if (!response.ok) {
        console.error('HTTP transport error:', response.statusText);
      }
    } catch (error) {
      console.error('HTTP transport error:', error);
    } finally {
      callback();
    }
  }
}

/**
 * Stream transport
 */
export class Stream implements Transport {
  public level?: string;
  public silent: boolean;
  public format?: any;
  public handleExceptions: boolean;
  public handleRejections: boolean;

  private stream: any;
  private eol: string;

  constructor(options: StreamTransportOptions) {
    this.level = options.level;
    this.silent = options.silent || false;
    this.format = options.format;
    this.handleExceptions = options.handleExceptions || false;
    this.handleRejections = options.handleRejections || false;

    this.stream = options.stream;
    this.eol = options.eol || '\n';
  }

  log(info: LogEntry, callback: () => void): void {
    setImmediate(() => {
      const output = this.format ? this.formatMessage(info) : JSON.stringify(info);
      this.stream.write(output + this.eol, callback);
    });
  }

  close(): void {
    if (this.stream && typeof this.stream.end === 'function') {
      this.stream.end();
    }
  }

  private formatMessage(info: LogEntry): string {
    return typeof info === 'string' ? info : JSON.stringify(info);
  }
}

/**
 * Daily rotate file transport
 */
export class DailyRotateFile extends File {
  private datePattern: string;
  private maxSize?: string;
  private maxFilesNum?: string;
  private lastRotation: string;

  constructor(options: FileTransportOptions & {
    datePattern?: string;
    maxSize?: string;
    maxFiles?: string;
  }) {
    super(options);
    this.datePattern = options.datePattern || 'YYYY-MM-DD';
    this.maxSize = options.maxSize;
    this.maxFilesNum = options.maxFiles as string;
    this.lastRotation = this.getDateString();
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

// Export all transports
export const transports = {
  Console,
  File,
  Http,
  Stream,
  DailyRotateFile,
};
