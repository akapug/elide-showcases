/**
 * Pino Standard Formatters
 */

import type { TimestampFn, Formatters } from './types';

/**
 * ISO time formatter
 */
function isoTime(): string {
  return `,"time":"${new Date().toISOString()}"`;
}

/**
 * Epoch time formatter
 */
function epochTime(): string {
  return `,"time":${Date.now()}`;
}

/**
 * Unix time formatter
 */
function unixTime(): string {
  return `,"time":${Math.floor(Date.now() / 1000)}`;
}

/**
 * No time formatter
 */
function nullTime(): string {
  return '';
}

export const stdTimeFunctions = {
  isoTime,
  epochTime,
  unixTime,
  nullTime,
};

/**
 * Level formatter - returns level as string
 */
function levelAsString(label: string, number: number): object {
  return { level: label };
}

/**
 * Level formatter - returns level as number
 */
function levelAsNumber(label: string, number: number): object {
  return { level: number };
}

/**
 * Bindings formatter - includes all bindings
 */
function allBindings(bindings: { [key: string]: any }): object {
  return bindings;
}

/**
 * Bindings formatter - excludes specific keys
 */
function excludeBindings(...keys: string[]): (bindings: { [key: string]: any }) => object {
  return (bindings) => {
    const result: any = {};

    for (const [key, value] of Object.entries(bindings)) {
      if (!keys.includes(key)) {
        result[key] = value;
      }
    }

    return result;
  };
}

/**
 * Log formatter - pass through
 */
function passThrough(object: { [key: string]: any }): object {
  return object;
}

export const stdFormatters: Formatters = {
  level: levelAsNumber,
  bindings: allBindings,
  log: passThrough,
};
