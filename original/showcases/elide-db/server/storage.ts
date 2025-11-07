/**
 * ServerStorage - Server-side storage using SQLite
 * Stores all changes and provides efficient querying
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import {
  Change,
  Timestamp,
  Document,
  TableName,
  DocumentId
} from '../types';

export class ServerStorage {
  private dbPath: string;
  private db: Database.Database | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize the storage
   */
  async init(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Create tables
    this.createTables();

    console.log('Server storage initialized');
  }

  /**
   * Create database tables
   */
  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Changes table - stores all changes from all clients
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS changes (
        id TEXT PRIMARY KEY,
        "table" TEXT NOT NULL,
        operation TEXT NOT NULL,
        documentId TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        clientId TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_changes_timestamp ON changes(timestamp);
      CREATE INDEX IF NOT EXISTS idx_changes_table ON changes("table");
      CREATE INDEX IF NOT EXISTS idx_changes_documentId ON changes(documentId);
      CREATE INDEX IF NOT EXISTS idx_changes_clientId ON changes(clientId);
    `);

    // Documents table - current state of all documents
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        "table" TEXT NOT NULL,
        data TEXT NOT NULL,
        version INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        clientId TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_documents_table ON documents("table");
      CREATE INDEX IF NOT EXISTS idx_documents_timestamp ON documents(timestamp);
    `);

    // Users table - for multi-tenancy
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);

    // Metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  /**
   * Store changes from a client
   */
  async storeChanges(changes: Change[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const insertChange = this.db.prepare(`
      INSERT OR REPLACE INTO changes
      (id, "table", operation, documentId, data, version, timestamp, clientId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertDocument = this.db.prepare(`
      INSERT OR REPLACE INTO documents
      (id, "table", data, version, timestamp, clientId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((changes: Change[]) => {
      for (const change of changes) {
        // Store the change
        insertChange.run(
          change.id,
          change.table,
          change.operation,
          change.documentId,
          JSON.stringify(change.data),
          change.version,
          change.timestamp,
          change.clientId
        );

        // Update current document state
        if (change.operation !== 'DELETE') {
          const doc = change.data as Document;
          insertDocument.run(
            doc.id,
            change.table,
            JSON.stringify(doc),
            doc._version,
            doc._timestamp,
            doc._clientId
          );
        }
      }
    });

    transaction(changes);
  }

  /**
   * Get changes since a timestamp
   */
  async getChanges(since: Timestamp): Promise<Change[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM changes
      WHERE timestamp > ?
      ORDER BY timestamp ASC
    `);

    const rows = stmt.all(since);

    return rows.map((row: any) => ({
      id: row.id,
      table: row.table,
      operation: row.operation,
      documentId: row.documentId,
      data: JSON.parse(row.data),
      version: row.version,
      timestamp: row.timestamp,
      clientId: row.clientId
    }));
  }

  /**
   * Get changes for a specific table
   */
  async getTableChanges(table: TableName, since: Timestamp): Promise<Change[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM changes
      WHERE "table" = ? AND timestamp > ?
      ORDER BY timestamp ASC
    `);

    const rows = stmt.all(table, since);

    return rows.map((row: any) => ({
      id: row.id,
      table: row.table,
      operation: row.operation,
      documentId: row.documentId,
      data: JSON.parse(row.data),
      version: row.version,
      timestamp: row.timestamp,
      clientId: row.clientId
    }));
  }

  /**
   * Get current state of a document
   */
  async getDocument(table: TableName, id: DocumentId): Promise<Document | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE "table" = ? AND id = ?
    `);

    const row = stmt.get(table, id) as any;

    if (!row) return null;

    return JSON.parse(row.data);
  }

  /**
   * Get all documents in a table
   */
  async getDocuments(table: TableName): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE "table" = ?
      ORDER BY timestamp DESC
    `);

    const rows = stmt.all(table);

    return rows.map((row: any) => JSON.parse(row.data));
  }

  /**
   * Delete old changes (for cleanup)
   */
  async pruneChanges(before: Timestamp): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      DELETE FROM changes
      WHERE timestamp < ?
    `);

    const result = stmt.run(before);
    return result.changes;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalChanges: number;
    totalDocuments: number;
    oldestChange: Timestamp;
    newestChange: Timestamp;
    databaseSize: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const changesCount = this.db.prepare('SELECT COUNT(*) as count FROM changes').get() as any;
    const docsCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as any;
    const oldestChange = this.db.prepare('SELECT MIN(timestamp) as ts FROM changes').get() as any;
    const newestChange = this.db.prepare('SELECT MAX(timestamp) as ts FROM changes').get() as any;

    const stats = fs.statSync(this.dbPath);

    return {
      totalChanges: changesCount.count,
      totalDocuments: docsCount.count,
      oldestChange: oldestChange.ts || 0,
      newestChange: newestChange.ts || 0,
      databaseSize: stats.size
    };
  }

  /**
   * Compact database (vacuum)
   */
  async compact(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.db.exec('VACUUM');
  }

  /**
   * Backup database
   */
  async backup(backupPath: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.backup(backupPath);
  }

  /**
   * Get metadata value
   */
  async getMetadata(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT value FROM metadata WHERE key = ?');
    const row = stmt.get(key) as any;

    return row ? JSON.parse(row.value) : null;
  }

  /**
   * Set metadata value
   */
  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO metadata (key, value)
      VALUES (?, ?)
    `);

    stmt.run(key, JSON.stringify(value));
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec('DELETE FROM changes');
    this.db.exec('DELETE FROM documents');
    this.db.exec('DELETE FROM metadata');
  }

  /**
   * Close the database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * In-memory storage for testing
 */
export class MemoryStorage extends ServerStorage {
  private changes: Change[] = [];
  private documents: Map<string, Document> = new Map();

  async init(): Promise<void> {
    // No-op for in-memory
  }

  async storeChanges(changes: Change[]): Promise<void> {
    this.changes.push(...changes);

    for (const change of changes) {
      if (change.operation !== 'DELETE') {
        const key = `${change.table}:${change.documentId}`;
        this.documents.set(key, change.data as Document);
      }
    }
  }

  async getChanges(since: Timestamp): Promise<Change[]> {
    return this.changes.filter(c => c.timestamp > since);
  }

  async getTableChanges(table: TableName, since: Timestamp): Promise<Change[]> {
    return this.changes.filter(
      c => c.table === table && c.timestamp > since
    );
  }

  async getDocument(table: TableName, id: DocumentId): Promise<Document | null> {
    const key = `${table}:${id}`;
    return this.documents.get(key) || null;
  }

  async getDocuments(table: TableName): Promise<Document[]> {
    const docs: Document[] = [];
    for (const [key, doc] of this.documents) {
      if (key.startsWith(`${table}:`)) {
        docs.push(doc);
      }
    }
    return docs;
  }

  async pruneChanges(before: Timestamp): Promise<number> {
    const beforeCount = this.changes.length;
    this.changes = this.changes.filter(c => c.timestamp >= before);
    return beforeCount - this.changes.length;
  }

  async getStats(): Promise<any> {
    return {
      totalChanges: this.changes.length,
      totalDocuments: this.documents.size,
      oldestChange: this.changes[0]?.timestamp || 0,
      newestChange: this.changes[this.changes.length - 1]?.timestamp || 0,
      databaseSize: 0
    };
  }

  async compact(): Promise<void> {
    // No-op
  }

  async backup(backupPath: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    this.changes = [];
    this.documents.clear();
  }

  close(): void {
    // No-op
  }
}
