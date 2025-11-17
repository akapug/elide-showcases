/**
 * @elide/redis - Production-ready Redis client for Elide
 *
 * Complete Redis protocol implementation with:
 * - All Redis commands (strings, hashes, lists, sets, sorted sets)
 * - Pipelining for batch operations
 * - Transactions (MULTI/EXEC)
 * - Pub/Sub messaging
 * - Lua script execution
 * - Connection pooling
 * - Cluster support
 * - Sentinel support
 * - Full TypeScript support
 */

export { RedisClient } from './client';
export { RedisPipeline } from './pipeline';
export { RedisPubSub } from './pubsub';
export { RedisCluster } from './cluster';
export { RedisConnectionPool } from './pool';
export * from './types';
export * from './commands';

import { RedisClient } from './client';
export default RedisClient;

/**
 * Create a new Redis client
 */
export function createClient(options?: any): RedisClient {
  return new RedisClient(options);
}
