/**
 * Elide KafkaJS Clone - Logger Implementation
 */

import { Logger, LogLevel, LogCreator, LogEntry } from './types';

export function createLogger(level: LogLevel = LogLevel.INFO): Logger {
  return new DefaultLogger(level);
}

export function createDefaultLogger(level: LogLevel = LogLevel.INFO): LogCreator {
  return (logLevel: LogLevel) => {
    return (entry: LogEntry) => {
      if (logLevel >= level) {
        console.log(JSON.stringify(entry.log));
      }
    };
  };
}

class DefaultLogger implements Logger {
  constructor(
    private level: LogLevel,
    private namespace_: string = 'KafkaJS'
  ) {}

  info(message: string, extra?: object): void {
    if (this.level >= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, extra);
    }
  }

  error(message: string, extra?: object): void {
    if (this.level >= LogLevel.ERROR) {
      this.log(LogLevel.ERROR, message, extra);
    }
  }

  warn(message: string, extra?: object): void {
    if (this.level >= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, extra);
    }
  }

  debug(message: string, extra?: object): void {
    if (this.level >= LogLevel.DEBUG) {
      this.log(LogLevel.DEBUG, message, extra);
    }
  }

  namespace(namespace: string): Logger {
    return new DefaultLogger(this.level, `${this.namespace_}:${namespace}`);
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  private log(level: LogLevel, message: string, extra?: object): void {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();

    const logData = {
      timestamp,
      level: levelName,
      logger: this.namespace_,
      message,
      ...extra,
    };

    const output = `[${timestamp}] ${levelName.padEnd(5)} [${this.namespace_}] ${message}`;

    if (extra && Object.keys(extra).length > 0) {
      console.log(output, extra);
    } else {
      console.log(output);
    }
  }
}
