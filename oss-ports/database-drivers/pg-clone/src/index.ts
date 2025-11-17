/**
 * @elide/pg - Production-ready PostgreSQL driver for Elide
 * Complete PostgreSQL protocol implementation
 */

export { Client, ClientConfig } from './client';
export { Pool, PoolConfig } from './pool';
export { QueryResult, QueryConfig, QueryArrayConfig, FieldDef } from './types';
export { Connection } from './connection';
export { PreparedStatement } from './prepared';
export { Notification, NotificationHandler } from './notification';
export * from './types';

import { Client } from './client';
export default Client;
