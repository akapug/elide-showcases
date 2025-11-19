/**
 * Winston Clone - Elide Implementation
 *
 * Flexible logging library with multiple transports and formats
 */

export * from './logger';
export * from './transports';
export * from './formats';
export * from './types';
export * from './config';

import { Logger } from './logger';
import { LoggerOptions } from './types';

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

// Export default logger
export const logger = createLogger();
