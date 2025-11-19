/**
 * Winston types and interfaces
 */

export interface LogEntry {
  level: string;
  message: string;
  timestamp?: string | number;
  [key: string]: any;
}

export interface LoggerOptions {
  level?: string;
  levels?: Levels;
  format?: Format;
  defaultMeta?: any;
  transports?: Transport[];
  exitOnError?: boolean;
  silent?: boolean;
  exceptionHandlers?: Transport[];
  rejectionHandlers?: Transport[];
}

export interface Levels {
  [key: string]: number;
}

export interface Colors {
  [key: string]: string;
}

export interface Format {
  transform(info: LogEntry, opts?: any): LogEntry | false;
}

export interface FormatWrap {
  (opts?: any): Format;
}

export interface Transport {
  log(info: LogEntry, callback: () => void): void;
  close?(): void;
  level?: string;
  silent?: boolean;
  format?: Format;
  handleExceptions?: boolean;
  handleRejections?: boolean;
}

export interface TransportOptions {
  level?: string;
  silent?: boolean;
  format?: Format;
  handleExceptions?: boolean;
  handleRejections?: boolean;
}

export interface ConsoleTransportOptions extends TransportOptions {
  stderrLevels?: string[];
  consoleWarnLevels?: string[];
  eol?: string;
}

export interface FileTransportOptions extends TransportOptions {
  filename: string;
  dirname?: string;
  maxsize?: number;
  maxFiles?: number;
  tailable?: boolean;
  maxRetries?: number;
  zippedArchive?: boolean;
  options?: any;
  stream?: any;
}

export interface HttpTransportOptions extends TransportOptions {
  host?: string;
  port?: number;
  path?: string;
  auth?: {
    username: string;
    password: string;
  };
  ssl?: boolean;
  batch?: boolean;
  batchInterval?: number;
  batchCount?: number;
}

export interface StreamTransportOptions extends TransportOptions {
  stream: any;
  eol?: string;
}

export interface QueryOptions {
  rows?: number;
  limit?: number;
  start?: number;
  from?: Date;
  until?: Date;
  order?: 'asc' | 'desc';
  fields?: string[];
}

export interface ProfileResult {
  level: string;
  message: string;
  durationMs: number;
  [key: string]: any;
}
