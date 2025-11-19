/**
 * Winston Configuration
 */

import type { Levels, Colors } from './types';

/**
 * npm log levels
 */
export const npmLevels: Levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

/**
 * npm colors
 */
export const npmColors: Colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};

/**
 * syslog levels
 */
export const syslogLevels: Levels = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7,
};

/**
 * syslog colors
 */
export const syslogColors: Colors = {
  emerg: 'red',
  alert: 'red',
  crit: 'red',
  error: 'red',
  warning: 'yellow',
  notice: 'green',
  info: 'green',
  debug: 'blue',
};

/**
 * CLI log levels
 */
export const cliLevels: Levels = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9,
};

/**
 * CLI colors
 */
export const cliColors: Colors = {
  error: 'red',
  warn: 'yellow',
  help: 'cyan',
  data: 'grey',
  info: 'green',
  debug: 'blue',
  prompt: 'grey',
  verbose: 'cyan',
  input: 'grey',
  silly: 'magenta',
};

/**
 * Configuration presets
 */
export const config = {
  npm: {
    levels: npmLevels,
    colors: npmColors,
  },
  syslog: {
    levels: syslogLevels,
    colors: syslogColors,
  },
  cli: {
    levels: cliLevels,
    colors: cliColors,
  },
};
