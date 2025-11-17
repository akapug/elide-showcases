/**
 * @elide/mysql2 - Production-ready MySQL driver for Elide
 * Complete MySQL protocol implementation
 */

export { Connection, ConnectionOptions } from './connection';
export { Pool, PoolOptions } from './pool';
export { PoolCluster, PoolClusterOptions } from './cluster';
export { PreparedStatement } from './prepared';
export * from './types';

import { createConnection, createPool, createPoolCluster } from './factory';
export { createConnection, createPool, createPoolCluster };
export default { createConnection, createPool, createPoolCluster };
