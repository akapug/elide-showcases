/**
 * Prometheus Client Clone - Elide Implementation
 *
 * A production-ready Prometheus metrics client library providing
 * full compatibility with the Prometheus exposition format.
 */

export * from './registry';
export * from './counter';
export * from './gauge';
export * from './histogram';
export * from './summary';
export * from './pushgateway';
export * from './defaultMetrics';
export * from './types';
export * from './validation';

// Export default registry instance
export { register } from './registry';
