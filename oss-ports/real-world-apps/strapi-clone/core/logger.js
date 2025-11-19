/**
 * Logger Implementation
 * Production-ready logging with multiple levels and transports
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.transports = options.transports || [new ConsoleTransport()];
    this.context = options.context || 'CMS';
  }

  debug(message, ...args) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message, ...args) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message, ...args) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  fatal(message, ...args) {
    this.log(LogLevel.FATAL, message, ...args);
  }

  log(level, message, ...args) {
    if (level < this.level) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      context: this.context,
      message,
      data: args.length > 0 ? args : undefined,
    };

    this.transports.forEach(transport => transport.write(entry));
  }

  getLevelName(level) {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    return names[level] || 'UNKNOWN';
  }

  child(context) {
    return new Logger({
      level: this.level,
      transports: this.transports,
      context,
    });
  }
}

class ConsoleTransport {
  write(entry) {
    const { timestamp, level, context, message, data } = entry;
    const color = this.getColor(level);
    const reset = '\x1b[0m';

    let output = `${color}[${timestamp}] [${level}] [${context}]${reset} ${message}`;

    if (data) {
      output += '\n' + JSON.stringify(data, null, 2);
    }

    if (level === 'ERROR' || level === 'FATAL') {
      console.error(output);
    } else if (level === 'WARN') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  getColor(level) {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m', // Magenta
    };
    return colors[level] || '';
  }
}

class FileTransport {
  constructor(filename) {
    this.filename = filename;
  }

  write(entry) {
    const line = JSON.stringify(entry) + '\n';
    // In production, use proper file writing with rotation
    // For now, this is a placeholder
    console.log(`[FileTransport] Would write to ${this.filename}: ${line}`);
  }
}

// Export singleton instance
export const logger = new Logger({
  level: process.env.LOG_LEVEL ? LogLevel[process.env.LOG_LEVEL] : LogLevel.INFO,
  transports: [
    new ConsoleTransport(),
    ...(process.env.LOG_FILE ? [new FileTransport(process.env.LOG_FILE)] : []),
  ],
});

export { Logger, ConsoleTransport, FileTransport, LogLevel };
