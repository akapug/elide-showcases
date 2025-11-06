/**
 * ElideBase - Admin API
 *
 * Provides administrative endpoints for managing collections, users,
 * and system configuration.
 */

import { SQLiteDatabase } from '../database/sqlite';
import { SchemaManager, CollectionSchema } from '../database/schema';
import { UserManager } from '../auth/users';

export interface AdminStats {
  collections: number;
  totalRecords: number;
  users: number;
  files: number;
  dbSize: number;
}

export class AdminAPI {
  private db: SQLiteDatabase;
  private schema: SchemaManager;
  private userManager: UserManager;

  constructor(db: SQLiteDatabase, schema: SchemaManager, userManager: UserManager) {
    this.db = db;
    this.schema = schema;
    this.userManager = userManager;
  }

  /**
   * Get system statistics
   */
  getStats(): AdminStats {
    const collections = this.schema.getCollectionNames();
    let totalRecords = 0;

    for (const collection of collections) {
      const result = this.db.queryOne(`SELECT COUNT(*) as count FROM ${collection}`);
      totalRecords += result?.count || 0;
    }

    const dbStats = this.db.getStats();
    const userStats = this.userManager.getStats();

    const filesResult = this.db.queryOne('SELECT COUNT(*) as count FROM files');

    return {
      collections: collections.length,
      totalRecords,
      users: userStats.total,
      files: filesResult?.count || 0,
      dbSize: dbStats.size
    };
  }

  /**
   * Get collection list with statistics
   */
  getCollections(): Array<{ name: string; fields: number; records: number }> {
    const collections = this.schema.getCollectionNames();

    return collections.map(name => {
      const schema = this.schema.getCollection(name);
      const result = this.db.queryOne(`SELECT COUNT(*) as count FROM ${name}`);

      return {
        name,
        fields: schema?.fields.length || 0,
        records: result?.count || 0
      };
    });
  }

  /**
   * Get collection schema
   */
  getCollectionSchema(name: string): CollectionSchema | null {
    const schema = this.schema.getCollection(name);
    return schema || null;
  }

  /**
   * Create a new collection
   */
  createCollection(schema: CollectionSchema): void {
    this.schema.registerCollection(schema);
  }

  /**
   * Delete a collection
   */
  deleteCollection(name: string): void {
    this.schema.dropCollection(name);
  }

  /**
   * Get recent activity log
   */
  getActivityLog(limit: number = 50): any[] {
    // In a real implementation, this would query an activity log table
    // For demonstration, we'll return a mock response
    return [
      {
        id: '1',
        type: 'collection.created',
        collection: 'posts',
        userId: 'admin',
        timestamp: new Date().toISOString()
      }
    ];
  }

  /**
   * Backup database
   */
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backups/backup_${timestamp}.db`;

    this.db.backup(backupPath);
    return backupPath;
  }

  /**
   * Get database health status
   */
  getHealthStatus(): any {
    try {
      // Test database connection
      this.db.queryOne('SELECT 1 as test');

      const stats = this.db.getStats();

      return {
        status: 'healthy',
        database: {
          connected: true,
          walEnabled: stats.walEnabled,
          activeTransactions: stats.activeTransactions
        },
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: String(error)
      };
    }
  }

  /**
   * Execute raw SQL query (admin only!)
   */
  executeQuery(sql: string): any {
    try {
      // Determine if it's a SELECT query
      const isSelect = sql.trim().toLowerCase().startsWith('select');

      if (isSelect) {
        const result = this.db.query(sql);
        return {
          success: true,
          rows: result.rows,
          count: result.rows.length
        };
      } else {
        const result = this.db.execute(sql);
        return {
          success: true,
          changes: result.changes
        };
      }
    } catch (error) {
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Get system configuration
   */
  getConfig(): any {
    return {
      database: {
        filename: this.db.getStats().filename,
        size: this.db.getStats().size
      },
      collections: this.schema.getCollectionNames().length,
      features: {
        realtime: true,
        fileStorage: true,
        oauth: true,
        hooks: true
      }
    };
  }

  /**
   * Vacuum database
   */
  vacuum(): void {
    this.db.vacuum();
  }
}
