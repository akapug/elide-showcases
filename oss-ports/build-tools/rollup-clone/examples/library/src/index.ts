/**
 * Example Library - Main Entry Point
 *
 * Demonstrates building a JavaScript library with Rollup Clone
 * that can be consumed in various environments (ESM, CJS, UMD, Browser)
 */

export { EventEmitter, type EventHandler, type EventMap } from './EventEmitter';
export { Cache, type CacheOptions } from './Cache';
export { Validator, type ValidationRule, type ValidationResult } from './Validator';
export { HttpClient, type RequestConfig, type Response } from './HttpClient';
export { Logger, type LogLevel, type LoggerConfig } from './Logger';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Initialize the library
 */
export function initialize(config?: LibraryConfig): void {
  if (config?.debug) {
    console.log(`Library initialized (v${VERSION})`);
  }
}

/**
 * Library configuration
 */
export interface LibraryConfig {
  debug?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default export for convenience
 */
export default {
  VERSION,
  initialize,
};
