/**
 * LocalDB - IndexedDB wrapper for browser-based local storage
 * Provides a simple key-value interface with indexing support
 */

import {
  Document,
  DocumentId,
  TableName,
  Change,
  Query,
  WhereClause,
  OrderByClause,
  StorageAdapter,
  Timestamp,
  OperationType
} from '../types';

export class LocalDB implements StorageAdapter {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private version: number = 1;
  private tables: Set<TableName> = new Set();
  private changeLog: Change[] = [];

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  /**
   * Initialize the database connection
   */
  async init(tables: TableName[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for each table
        for (const table of tables) {
          if (!db.objectStoreNames.contains(table)) {
            const store = db.createObjectStore(table, { keyPath: 'id' });
            store.createIndex('_timestamp', '_timestamp', { unique: false });
            store.createIndex('_version', '_version', { unique: false });
            store.createIndex('_clientId', '_clientId', { unique: false });
          }
          this.tables.add(table);
        }

        // Create changelog store
        if (!db.objectStoreNames.contains('_changelog')) {
          const changeStore = db.createObjectStore('_changelog', { keyPath: 'id' });
          changeStore.createIndex('timestamp', 'timestamp', { unique: false });
          changeStore.createIndex('table', 'table', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('_metadata')) {
          db.createObjectStore('_metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get a single document by ID
   */
  async get(table: TableName, id: DocumentId): Promise<Document | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.get(id);

      request.onsuccess = () => {
        const doc = request.result as Document | undefined;
        if (doc && !doc._deleted) {
          resolve(doc);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all documents from a table
   */
  async getAll(table: TableName): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs = request.result as Document[];
        // Filter out deleted documents
        resolve(docs.filter(doc => !doc._deleted));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query documents with filters, sorting, and pagination
   */
  async query(query: Query): Promise<Document[]> {
    let results = await this.getAll(query.table);

    // Apply where clause
    if (query.where) {
      results = this.applyWhereClause(results, query.where);
    }

    // Apply ordering
    if (query.orderBy && query.orderBy.length > 0) {
      results = this.applyOrderBy(results, query.orderBy);
    }

    // Apply pagination
    if (query.offset !== undefined) {
      results = results.slice(query.offset);
    }
    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Insert or update a document
   */
  async put(document: Document): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([document._table, '_changelog'], 'readwrite');
      const store = transaction.objectStore(document._table);
      const changeStore = transaction.objectStore('_changelog');

      // Check if document exists
      const getRequest = store.get(document.id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result as Document | undefined;
        const operation = existing ? OperationType.UPDATE : OperationType.INSERT;

        // Create change record
        const change: Change = {
          id: `${Date.now()}-${Math.random()}`,
          table: document._table,
          operation,
          documentId: document.id,
          data: document,
          version: document._version,
          timestamp: document._timestamp,
          clientId: document._clientId
        };

        // Put document
        const putRequest = store.put(document);
        putRequest.onerror = () => reject(putRequest.error);

        // Add to changelog
        const changeRequest = changeStore.put(change);
        changeRequest.onerror = () => reject(changeRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Delete a document (soft delete)
   */
  async delete(table: TableName, id: DocumentId): Promise<void> {
    const doc = await this.get(table, id);
    if (!doc) return;

    doc._deleted = true;
    doc._version++;
    doc._timestamp = Date.now();

    await this.put(doc);
  }

  /**
   * Get changes since a timestamp
   */
  async getChanges(since: Timestamp): Promise<Change[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['_changelog'], 'readonly');
      const store = transaction.objectStore('_changelog');
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(since, true);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result as Change[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Apply a batch of changes from sync
   */
  async applyChanges(changes: Change[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const change of changes) {
      if (change.operation === OperationType.DELETE) {
        await this.delete(change.table, change.documentId);
      } else {
        const doc = change.data as Document;
        await this.put(doc);
      }
    }
  }

  /**
   * Clear all data from the database
   */
  async clear(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(
      Array.from(this.tables).concat(['_changelog', '_metadata']),
      'readwrite'
    );

    for (const table of this.tables) {
      transaction.objectStore(table).clear();
    }
    transaction.objectStore('_changelog').clear();
    transaction.objectStore('_metadata').clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get/set metadata
   */
  async getMetadata(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['_metadata'], 'readonly');
      const store = transaction.objectStore('_metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['_metadata'], 'readwrite');
      const store = transaction.objectStore('_metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Apply where clause filtering
   */
  private applyWhereClause(docs: Document[], where: WhereClause): Document[] {
    return docs.filter(doc => {
      for (const [field, condition] of Object.entries(where)) {
        const value = doc[field];

        if (typeof condition === 'object' && condition !== null) {
          // Operator-based condition
          for (const [op, expected] of Object.entries(condition)) {
            switch (op) {
              case '$eq':
                if (value !== expected) return false;
                break;
              case '$ne':
                if (value === expected) return false;
                break;
              case '$gt':
                if (value <= expected) return false;
                break;
              case '$gte':
                if (value < expected) return false;
                break;
              case '$lt':
                if (value >= expected) return false;
                break;
              case '$lte':
                if (value > expected) return false;
                break;
              case '$in':
                if (!Array.isArray(expected) || !expected.includes(value)) return false;
                break;
              case '$nin':
                if (!Array.isArray(expected) || expected.includes(value)) return false;
                break;
              case '$like':
                const regex = new RegExp(expected.replace(/%/g, '.*'), 'i');
                if (!regex.test(String(value))) return false;
                break;
            }
          }
        } else {
          // Simple equality
          if (value !== condition) return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply ordering
   */
  private applyOrderBy(docs: Document[], orderBy: OrderByClause[]): Document[] {
    return docs.sort((a, b) => {
      for (const clause of orderBy) {
        const aVal = a[clause.field];
        const bVal = b[clause.field];

        if (aVal === bVal) continue;

        const comparison = aVal < bVal ? -1 : 1;
        return clause.direction === 'ASC' ? comparison : -comparison;
      }
      return 0;
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Node.js implementation using SQLite
 */
export class LocalDBNode implements StorageAdapter {
  private dbPath: string;
  private db: any = null; // better-sqlite3 instance
  private tables: Set<TableName> = new Set();

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async init(tables: TableName[]): Promise<void> {
    // Dynamic import for better-sqlite3
    const Database = require('better-sqlite3');
    this.db = new Database(this.dbPath);

    // Create tables
    for (const table of tables) {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id TEXT PRIMARY KEY,
          _table TEXT NOT NULL,
          _version INTEGER NOT NULL,
          _timestamp INTEGER NOT NULL,
          _clientId TEXT NOT NULL,
          _deleted INTEGER DEFAULT 0,
          data TEXT NOT NULL
        )
      `);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_timestamp ON ${table}(_timestamp)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_version ON ${table}(_version)`);
      this.tables.add(table);
    }

    // Create changelog table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _changelog (
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
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_changelog_timestamp ON _changelog(timestamp)`);

    // Create metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  async get(table: TableName, id: DocumentId): Promise<Document | null> {
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ? AND _deleted = 0`);
    const row = stmt.get(id);
    return row ? this.rowToDocument(row) : null;
  }

  async getAll(table: TableName): Promise<Document[]> {
    const stmt = this.db.prepare(`SELECT * FROM ${table} WHERE _deleted = 0`);
    const rows = stmt.all();
    return rows.map(this.rowToDocument);
  }

  async query(query: Query): Promise<Document[]> {
    let sql = `SELECT * FROM ${query.table} WHERE _deleted = 0`;
    const params: any[] = [];

    // Build WHERE clause
    if (query.where) {
      const whereClauses = this.buildWhereClause(query.where, params);
      if (whereClauses.length > 0) {
        sql += ` AND (${whereClauses.join(' AND ')})`;
      }
    }

    // Build ORDER BY clause
    if (query.orderBy && query.orderBy.length > 0) {
      const orderParts = query.orderBy.map(o =>
        `json_extract(data, '$.${o.field}') ${o.direction}`
      );
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    // Add pagination
    if (query.limit !== undefined) {
      sql += ` LIMIT ${query.limit}`;
    }
    if (query.offset !== undefined) {
      sql += ` OFFSET ${query.offset}`;
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(this.rowToDocument);
  }

  async put(document: Document): Promise<void> {
    const exists = await this.get(document._table, document.id);
    const operation = exists ? OperationType.UPDATE : OperationType.INSERT;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ${document._table}
      (id, _table, _version, _timestamp, _clientId, _deleted, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      document.id,
      document._table,
      document._version,
      document._timestamp,
      document._clientId,
      document._deleted ? 1 : 0,
      JSON.stringify(document)
    );

    // Add to changelog
    const change: Change = {
      id: `${Date.now()}-${Math.random()}`,
      table: document._table,
      operation,
      documentId: document.id,
      data: document,
      version: document._version,
      timestamp: document._timestamp,
      clientId: document._clientId
    };

    const changeStmt = this.db.prepare(`
      INSERT INTO _changelog
      (id, "table", operation, documentId, data, version, timestamp, clientId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    changeStmt.run(
      change.id,
      change.table,
      change.operation,
      change.documentId,
      JSON.stringify(change.data),
      change.version,
      change.timestamp,
      change.clientId
    );
  }

  async delete(table: TableName, id: DocumentId): Promise<void> {
    const doc = await this.get(table, id);
    if (!doc) return;

    doc._deleted = true;
    doc._version++;
    doc._timestamp = Date.now();

    await this.put(doc);
  }

  async getChanges(since: Timestamp): Promise<Change[]> {
    const stmt = this.db.prepare(`SELECT * FROM _changelog WHERE timestamp > ? ORDER BY timestamp`);
    const rows = stmt.all(since);
    return rows.map((row: any) => ({
      ...row,
      data: JSON.parse(row.data)
    }));
  }

  async applyChanges(changes: Change[]): Promise<void> {
    const transaction = this.db.transaction((changes: Change[]) => {
      for (const change of changes) {
        if (change.operation === OperationType.DELETE) {
          this.delete(change.table, change.documentId);
        } else {
          this.put(change.data as Document);
        }
      }
    });

    transaction(changes);
  }

  async clear(): Promise<void> {
    for (const table of this.tables) {
      this.db.exec(`DELETE FROM ${table}`);
    }
    this.db.exec(`DELETE FROM _changelog`);
    this.db.exec(`DELETE FROM _metadata`);
  }

  private rowToDocument(row: any): Document {
    const data = JSON.parse(row.data);
    return {
      ...data,
      id: row.id,
      _table: row._table,
      _version: row._version,
      _timestamp: row._timestamp,
      _clientId: row._clientId,
      _deleted: row._deleted === 1
    };
  }

  private buildWhereClause(where: WhereClause, params: any[]): string[] {
    const clauses: string[] = [];

    for (const [field, condition] of Object.entries(where)) {
      const jsonPath = `json_extract(data, '$.${field}')`;

      if (typeof condition === 'object' && condition !== null) {
        for (const [op, value] of Object.entries(condition)) {
          switch (op) {
            case '$eq':
              clauses.push(`${jsonPath} = ?`);
              params.push(value);
              break;
            case '$ne':
              clauses.push(`${jsonPath} != ?`);
              params.push(value);
              break;
            case '$gt':
              clauses.push(`${jsonPath} > ?`);
              params.push(value);
              break;
            case '$gte':
              clauses.push(`${jsonPath} >= ?`);
              params.push(value);
              break;
            case '$lt':
              clauses.push(`${jsonPath} < ?`);
              params.push(value);
              break;
            case '$lte':
              clauses.push(`${jsonPath} <= ?`);
              params.push(value);
              break;
            case '$in':
              const placeholders = (value as any[]).map(() => '?').join(',');
              clauses.push(`${jsonPath} IN (${placeholders})`);
              params.push(...(value as any[]));
              break;
            case '$like':
              clauses.push(`${jsonPath} LIKE ?`);
              params.push(value);
              break;
          }
        }
      } else {
        clauses.push(`${jsonPath} = ?`);
        params.push(condition);
      }
    }

    return clauses;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
