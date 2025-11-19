/**
 * Elide Bull Clone - Main Entry Point
 * Production-ready Redis-based queue system for Elide
 */

import { QueueImpl } from './queue';
import { QueueOptions } from './types';

/**
 * Create a new queue
 */
export function createQueue<T = any>(name: string, options?: QueueOptions): QueueImpl<T> {
  return new QueueImpl<T>(name, options);
}

// Export types and classes
export * from './types';
export { QueueImpl as Queue } from './queue';
export { JobImpl as Job } from './job';
export { Worker } from './worker';
export { Scheduler } from './scheduler';

// Default export
export default createQueue;
