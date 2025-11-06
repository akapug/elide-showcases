/**
 * Logger Utility
 *
 * Simple structured logging with different levels
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const currentLevel = LogLevel[LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;

function formatMessage(level: string, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + JSON.stringify(args) : '';
  return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

export const logger = {
  debug(message: string, ...args: any[]): void {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(formatMessage('DEBUG', message, ...args));
    }
  },

  info(message: string, ...args: any[]): void {
    if (currentLevel <= LogLevel.INFO) {
      console.log(formatMessage('INFO', message, ...args));
    }
  },

  warn(message: string, ...args: any[]): void {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(formatMessage('WARN', message, ...args));
    }
  },

  error(message: string, ...args: any[]): void {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(formatMessage('ERROR', message, ...args));
    }
  },
};
