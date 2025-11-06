/**
 * ElideDB - Local-first real-time database
 *
 * @example
 * ```typescript
 * import { ElideDB } from 'elide-db';
 *
 * const db = new ElideDB({
 *   name: 'my-app',
 *   syncUrl: 'ws://localhost:3000'
 * });
 *
 * await db.init([
 *   {
 *     name: 'users',
 *     fields: [
 *       { name: 'name', type: 'string', required: true },
 *       { name: 'email', type: 'string', required: true }
 *     ]
 *   }
 * ]);
 *
 * // Insert a document
 * await db.insert('users', { name: 'Alice', email: 'alice@example.com' });
 *
 * // Query with SQL-like syntax
 * const users = await db.table('users')
 *   .where('name', 'like', '%Alice%')
 *   .orderBy('name', 'ASC')
 *   .get();
 *
 * // Subscribe to real-time updates
 * db.table('users').subscribe((users) => {
 *   console.log('Users updated:', users);
 * });
 * ```
 */

// Core exports
export { ElideDB } from './client/client-api';
export { QueryBuilder, SQLParser } from './client/query-builder';
export {
  SubscriptionManager,
  ReactiveSubscription,
  useElideQuery
} from './client/subscriptions';

// Server exports
export { SyncServer } from './server/sync-server';
export { ServerStorage, MemoryStorage } from './server/storage';
export {
  AuthManager,
  PermissionManager,
  RowLevelSecurity,
  ApiKeyManager
} from './server/auth';

// Core engine exports
export { LocalDB, LocalDBNode } from './core/local-db';
export { SyncEngine, SyncEngineNode } from './core/sync-engine';
export { ConflictResolver } from './core/conflict-resolver';

// Type exports
export type {
  Document,
  DocumentId,
  TableName,
  Timestamp,
  Version,
  Change,
  OperationType,
  SyncMessage,
  VectorClock,
  Query,
  WhereClause,
  WhereOperator,
  OrderByClause,
  Subscription,
  DatabaseConfig,
  ConflictResolutionStrategy,
  StorageAdapter,
  AuthToken,
  FileAttachment,
  TableSchema,
  FieldSchema,
  IndexSchema,
  Transaction,
  ReplicationState
} from './types';

// Example exports
export { CollaborativeTodoApp } from './examples/collaborative-todo';
export { OfflineNotesApp } from './examples/offline-notes';
export { MultiplayerTicTacToe } from './examples/multiplayer-game';

/**
 * Version
 */
export const VERSION = '0.1.0';

/**
 * Create a new ElideDB instance (convenience function)
 */
export function createDB(config: Partial<import('./types').DatabaseConfig> = {}) {
  return new ElideDB(config);
}

/**
 * Create a sync server (convenience function)
 */
export function createServer(config: {
  port: number;
  dbPath?: string;
}) {
  const { ServerStorage } = require('./server/storage');
  const { SyncServer } = require('./server/sync-server');

  const storage = new ServerStorage(config.dbPath || './data/elidedb.db');
  return new SyncServer({
    port: config.port,
    storage
  });
}

// Default export
export default {
  ElideDB,
  createDB,
  createServer,
  VERSION
};
