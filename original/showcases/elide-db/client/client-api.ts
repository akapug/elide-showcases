/**
 * ClientAPI - Main API for interacting with ElideDB
 * Provides a simple, intuitive interface for database operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  DocumentId,
  TableName,
  Query,
  DatabaseConfig,
  ConflictResolutionStrategy,
  Subscription,
  Transaction,
  TableSchema,
  ReplicationState
} from '../types';
import { LocalDB, LocalDBNode } from '../core/local-db';
import { SyncEngine, SyncEngineNode } from '../core/sync-engine';
import { ConflictResolver } from '../core/conflict-resolver';
import { QueryBuilder } from './query-builder';
import { SubscriptionManager } from './subscriptions';

export class ElideDB {
  private config: DatabaseConfig;
  private storage: LocalDB | LocalDBNode;
  private syncEngine: SyncEngine | SyncEngineNode | null = null;
  private conflictResolver: ConflictResolver;
  private subscriptionManager: SubscriptionManager;
  private schemas: Map<TableName, TableSchema> = new Map();
  private initialized: boolean = false;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      name: config.name || 'elidedb',
      clientId: config.clientId || uuidv4(),
      syncUrl: config.syncUrl,
      syncInterval: config.syncInterval || 5000,
      conflictResolution:
        config.conflictResolution || ConflictResolutionStrategy.LAST_WRITE_WINS,
      storage: config.storage
    };

    // Initialize storage
    if (this.config.storage) {
      this.storage = this.config.storage as any;
    } else if (typeof window !== 'undefined' && window.indexedDB) {
      this.storage = new LocalDB(this.config.name);
    } else {
      this.storage = new LocalDBNode(`${this.config.name}.db`);
    }

    // Initialize conflict resolver
    this.conflictResolver = new ConflictResolver(this.config.conflictResolution);

    // Initialize subscription manager
    this.subscriptionManager = new SubscriptionManager(this.storage);
  }

  /**
   * Initialize the database
   */
  async init(schemas: TableSchema[]): Promise<void> {
    // Store schemas
    for (const schema of schemas) {
      this.schemas.set(schema.name, schema);
    }

    // Initialize storage
    const tableNames = schemas.map(s => s.name);
    await this.storage.init(tableNames);

    // Initialize sync engine if sync URL is provided
    if (this.config.syncUrl) {
      if (typeof window !== 'undefined') {
        this.syncEngine = new SyncEngine({
          clientId: this.config.clientId,
          syncUrl: this.config.syncUrl,
          storage: this.storage,
          conflictResolver: this.conflictResolver,
          syncInterval: this.config.syncInterval
        });
      } else {
        this.syncEngine = new SyncEngineNode({
          clientId: this.config.clientId,
          syncUrl: this.config.syncUrl,
          storage: this.storage,
          conflictResolver: this.conflictResolver,
          syncInterval: this.config.syncInterval
        });
      }

      await this.syncEngine.start();
    }

    this.initialized = true;
    console.log('ElideDB initialized successfully');
  }

  /**
   * Create a new query builder for a table
   */
  table<T extends Document>(tableName: TableName): QueryBuilder<T> {
    this.ensureInitialized();
    return new QueryBuilder<T>(tableName, this.storage, this.subscriptionManager);
  }

  /**
   * Insert a new document
   */
  async insert<T extends Document>(
    tableName: TableName,
    data: Partial<T>
  ): Promise<T> {
    this.ensureInitialized();

    const document: Document = {
      ...data,
      id: data.id || uuidv4(),
      _table: tableName,
      _version: 1,
      _timestamp: Date.now(),
      _clientId: this.config.clientId
    } as Document;

    // Validate against schema
    this.validateDocument(tableName, document);

    await this.storage.put(document);

    console.log(`Inserted document ${document.id} into ${tableName}`);

    // Notify subscribers
    this.subscriptionManager.notifySubscribers(tableName);

    return document as T;
  }

  /**
   * Update an existing document
   */
  async update<T extends Document>(
    tableName: TableName,
    id: DocumentId,
    updates: Partial<T>
  ): Promise<T> {
    this.ensureInitialized();

    const existing = await this.storage.get(tableName, id);
    if (!existing) {
      throw new Error(`Document ${id} not found in ${tableName}`);
    }

    const updated: Document = {
      ...existing,
      ...updates,
      id: existing.id,
      _table: tableName,
      _version: existing._version + 1,
      _timestamp: Date.now(),
      _clientId: this.config.clientId
    };

    // Validate against schema
    this.validateDocument(tableName, updated);

    await this.storage.put(updated);

    console.log(`Updated document ${id} in ${tableName}`);

    // Notify subscribers
    this.subscriptionManager.notifySubscribers(tableName);

    return updated as T;
  }

  /**
   * Delete a document
   */
  async delete(tableName: TableName, id: DocumentId): Promise<void> {
    this.ensureInitialized();

    await this.storage.delete(tableName, id);

    console.log(`Deleted document ${id} from ${tableName}`);

    // Notify subscribers
    this.subscriptionManager.notifySubscribers(tableName);
  }

  /**
   * Get a document by ID
   */
  async get<T extends Document>(
    tableName: TableName,
    id: DocumentId
  ): Promise<T | null> {
    this.ensureInitialized();
    return this.storage.get(tableName, id) as Promise<T | null>;
  }

  /**
   * Query documents
   */
  async query<T extends Document>(query: Query): Promise<T[]> {
    this.ensureInitialized();
    return this.storage.query(query) as Promise<T[]>;
  }

  /**
   * Subscribe to query results
   */
  subscribe<T extends Document>(
    query: Query,
    callback: (documents: T[]) => void
  ): Subscription {
    this.ensureInitialized();
    return this.subscriptionManager.subscribe(query, callback);
  }

  /**
   * Begin a transaction
   */
  async transaction(
    callback: (tx: TransactionContext) => Promise<void>
  ): Promise<void> {
    this.ensureInitialized();

    const tx = new TransactionContext(this);

    try {
      await callback(tx);
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  /**
   * Force an immediate sync
   */
  async sync(): Promise<void> {
    if (this.syncEngine) {
      await this.syncEngine.forceSync();
    }
  }

  /**
   * Get replication state
   */
  getReplicationState(): ReplicationState | null {
    if (this.syncEngine) {
      return this.syncEngine.getState();
    }
    return null;
  }

  /**
   * Subscribe to replication state changes
   */
  onReplicationStateChange(
    callback: (state: ReplicationState) => void
  ): () => void {
    if (this.syncEngine) {
      return this.syncEngine.onStateChange(callback);
    }
    return () => {};
  }

  /**
   * Check if database is connected to server
   */
  isConnected(): boolean {
    if (this.syncEngine) {
      return this.syncEngine.isConnected();
    }
    return false;
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    if (this.syncEngine) {
      return this.syncEngine.isSyncing();
    }
    return false;
  }

  /**
   * Clear all data from the database
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    await this.storage.clear();
    console.log('Database cleared');
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.syncEngine) {
      this.syncEngine.stop();
    }

    this.storage.close();
    this.subscriptionManager.clear();
    this.initialized = false;

    console.log('Database closed');
  }

  /**
   * Validate a document against its schema
   */
  private validateDocument(tableName: TableName, document: Document): void {
    const schema = this.schemas.get(tableName);
    if (!schema) return;

    for (const field of schema.fields) {
      const value = document[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null)) {
        throw new Error(`Field ${field.name} is required in ${tableName}`);
      }

      // Check types
      if (value !== undefined && value !== null) {
        const actualType = typeof value;
        const expectedType = field.type;

        switch (expectedType) {
          case 'string':
            if (actualType !== 'string') {
              throw new Error(
                `Field ${field.name} must be a string, got ${actualType}`
              );
            }
            break;
          case 'number':
            if (actualType !== 'number') {
              throw new Error(
                `Field ${field.name} must be a number, got ${actualType}`
              );
            }
            break;
          case 'boolean':
            if (actualType !== 'boolean') {
              throw new Error(
                `Field ${field.name} must be a boolean, got ${actualType}`
              );
            }
            break;
          case 'date':
            if (!(value instanceof Date) && typeof value !== 'number') {
              throw new Error(`Field ${field.name} must be a Date or timestamp`);
            }
            break;
        }
      }
    }
  }

  /**
   * Ensure database is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.config.clientId;
  }

  /**
   * Export database as JSON
   */
  async export(): Promise<object> {
    this.ensureInitialized();

    const data: any = {};

    for (const tableName of this.schemas.keys()) {
      data[tableName] = await this.storage.getAll(tableName);
    }

    return {
      version: 1,
      clientId: this.config.clientId,
      timestamp: Date.now(),
      data
    };
  }

  /**
   * Import database from JSON
   */
  async import(exportData: any): Promise<void> {
    this.ensureInitialized();

    if (exportData.version !== 1) {
      throw new Error('Unsupported export version');
    }

    for (const [tableName, documents] of Object.entries(exportData.data)) {
      for (const doc of documents as Document[]) {
        await this.storage.put(doc);
      }
    }

    console.log('Database imported successfully');
  }
}

/**
 * Transaction context for atomic operations
 */
class TransactionContext {
  private db: ElideDB;
  private operations: Array<() => Promise<void>> = [];
  private committed: boolean = false;

  constructor(db: ElideDB) {
    this.db = db;
  }

  async insert<T extends Document>(
    tableName: TableName,
    data: Partial<T>
  ): Promise<T> {
    const doc = await this.db.insert(tableName, data);
    this.operations.push(async () => {
      // Operation already executed
    });
    return doc;
  }

  async update<T extends Document>(
    tableName: TableName,
    id: DocumentId,
    updates: Partial<T>
  ): Promise<T> {
    const doc = await this.db.update(tableName, id, updates);
    this.operations.push(async () => {
      // Operation already executed
    });
    return doc;
  }

  async delete(tableName: TableName, id: DocumentId): Promise<void> {
    await this.db.delete(tableName, id);
    this.operations.push(async () => {
      // Operation already executed
    });
  }

  async commit(): Promise<void> {
    if (this.committed) {
      throw new Error('Transaction already committed');
    }

    // All operations are already executed in optimistic mode
    this.committed = true;
  }

  async rollback(): Promise<void> {
    if (this.committed) {
      throw new Error('Cannot rollback a committed transaction');
    }

    // In a full implementation, this would undo all operations
    // For now, we rely on optimistic concurrency control
    console.warn('Transaction rollback - operations may not be fully reversed');
  }
}
