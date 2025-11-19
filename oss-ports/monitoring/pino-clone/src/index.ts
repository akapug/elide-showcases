/**
 * Pino Clone - Elide Implementation
 *
 * Extremely fast, low-overhead logging library
 */

export * from './logger';
export * from './types';
export * from './serializers';
export * from './formatters';
export * from './levels';

import { Logger, LoggerOptions } from './logger';
import { stdSerializers } from './serializers';
import { stdTimeFunctions } from './formatters';

/**
 * Create a pino logger
 */
function pino(options?: LoggerOptions): Logger;
function pino(stream?: any): Logger;
function pino(options: LoggerOptions, stream: any): Logger;
function pino(optionsOrStream?: LoggerOptions | any, stream?: any): Logger {
  let options: LoggerOptions = {};
  let destination: any = process.stdout;

  if (optionsOrStream && typeof optionsOrStream.write === 'function') {
    destination = optionsOrStream;
  } else if (optionsOrStream) {
    options = optionsOrStream;
  }

  if (stream) {
    destination = stream;
  }

  return new Logger(options, destination);
}

// Export default
export default pino;

// Export utilities
pino.stdSerializers = stdSerializers;
pino.stdTimeFunctions = stdTimeFunctions;
pino.levels = {
  values: {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
  },
  labels: {
    '10': 'trace',
    '20': 'debug',
    '30': 'info',
    '40': 'warn',
    '50': 'error',
    '60': 'fatal',
  },
};
