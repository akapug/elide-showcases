/**
 * Main Entry Point
 * Export all public APIs
 */

// Database
export { DatabaseConnection, initDatabase, getDatabase, closeDatabase } from './database/connection.js';
export { QueryBuilder, table } from './database/query-builder.js';

// Collections
export { CollectionManager, Collection, SchemaField, FieldType } from './collections/manager.js';
export * from './collections/schema.js';

// API
export { RecordsAPI, ListOptions, ListResult } from './api/records.js';

// Auth
export { AuthService, AuthResponse, OAuth2Provider } from './auth/service.js';

// Real-time
export { RealtimeService, SSEManager, Subscription, SubscriptionMessage } from './realtime/subscriptions.js';

// Storage
export { StorageService, StorageConfig, FileUpload, StoredFile } from './storage/service.js';

// Rules
export { RulesEngine, RulesMiddleware, RuleContext, RuleType } from './rules/engine.js';

// Hooks
export { HooksManager, HookEvent, HookContext, HookHandler, CustomEndpoint, BuiltInHooks } from './hooks/manager.js';

// Migrations
export { MigrationsManager, Migration } from './migrations/manager.js';

// Server
export { PocketBaseServer, ServerConfig } from './server.js';

// Create and start a server
export async function createServer(config: Partial<import('./server.js').ServerConfig> = {}) {
  const { PocketBaseServer } = await import('./server.js');
  const { nanoid } = await import('nanoid');

  const defaultConfig = {
    port: 8090,
    host: '0.0.0.0',
    dbPath: './pb_data/data.db',
    jwtSecret: process.env.JWT_SECRET || nanoid(32),
    storagePath: './pb_data/storage',
  };

  const server = new PocketBaseServer({ ...defaultConfig, ...config });
  await server.init();
  await server.start();

  return server;
}

// Default export
export default {
  createServer,
};
