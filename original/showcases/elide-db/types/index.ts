/**
 * ElideDB Type Definitions
 * Shared types across the entire system
 */

export type DocumentId = string;
export type TableName = string;
export type Timestamp = number;
export type Version = number;

/**
 * Document represents a single record in a table
 */
export interface Document {
  id: DocumentId;
  _table: TableName;
  _version: Version;
  _timestamp: Timestamp;
  _clientId: string;
  _deleted?: boolean;
  [key: string]: any;
}

/**
 * Operation types for CRDT-based conflict resolution
 */
export enum OperationType {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Change represents a single mutation to the database
 */
export interface Change {
  id: string;
  table: TableName;
  operation: OperationType;
  documentId: DocumentId;
  data: Partial<Document>;
  version: Version;
  timestamp: Timestamp;
  clientId: string;
}

/**
 * SyncMessage is the wire format for sync protocol
 */
export interface SyncMessage {
  type: 'sync' | 'ack' | 'pull' | 'push';
  clientId: string;
  changes?: Change[];
  lastSyncTime?: Timestamp;
  vectorClock?: VectorClock;
}

/**
 * Vector clock for causal ordering
 */
export type VectorClock = Record<string, Version>;

/**
 * Query types for SQL-like operations
 */
export interface Query {
  table: TableName;
  where?: WhereClause;
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
}

export interface WhereClause {
  [key: string]: any | WhereOperator;
}

export interface WhereOperator {
  $eq?: any;
  $ne?: any;
  $gt?: any;
  $gte?: any;
  $lt?: any;
  $lte?: any;
  $in?: any[];
  $nin?: any[];
  $like?: string;
}

export interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Subscription for real-time updates
 */
export interface Subscription {
  id: string;
  query: Query;
  callback: (documents: Document[]) => void;
  unsubscribe: () => void;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  name: string;
  clientId: string;
  syncUrl?: string;
  syncInterval?: number;
  conflictResolution?: ConflictResolutionStrategy;
  storage?: StorageAdapter;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'LAST_WRITE_WINS',
  FIRST_WRITE_WINS = 'FIRST_WRITE_WINS',
  CUSTOM = 'CUSTOM'
}

/**
 * Storage adapter interface for different backends
 */
export interface StorageAdapter {
  get(table: TableName, id: DocumentId): Promise<Document | null>;
  getAll(table: TableName): Promise<Document[]>;
  query(query: Query): Promise<Document[]>;
  put(document: Document): Promise<void>;
  delete(table: TableName, id: DocumentId): Promise<void>;
  getChanges(since: Timestamp): Promise<Change[]>;
  applyChanges(changes: Change[]): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Auth token for server communication
 */
export interface AuthToken {
  userId: string;
  token: string;
  expiresAt: Timestamp;
}

/**
 * File attachment support
 */
export interface FileAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: Blob | Buffer;
  uploadedAt: Timestamp;
}

/**
 * Schema definition for tables
 */
export interface TableSchema {
  name: TableName;
  fields: FieldSchema[];
  indexes?: IndexSchema[];
}

export interface FieldSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'file';
  required?: boolean;
  unique?: boolean;
  default?: any;
}

export interface IndexSchema {
  fields: string[];
  unique?: boolean;
}

/**
 * Transaction support
 */
export interface Transaction {
  id: string;
  changes: Change[];
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Replication state
 */
export interface ReplicationState {
  lastSyncTime: Timestamp;
  vectorClock: VectorClock;
  pendingChanges: Change[];
  syncInProgress: boolean;
}
