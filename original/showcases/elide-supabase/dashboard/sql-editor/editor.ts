/**
 * SQL Editor
 *
 * Interactive SQL query editor with syntax highlighting and results
 */

import { DatabaseManager } from '../../database/manager';
import { AuthManager } from '../../auth/manager';
import { DashboardConfig } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * Query history entry
 */
interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  duration: number;
  rows: number;
  error?: string;
}

/**
 * SQL editor
 */
export class SQLEditor {
  private config: DashboardConfig;
  private database: DatabaseManager;
  private auth: AuthManager;
  private logger: Logger;
  private history: QueryHistory[] = [];
  private maxHistory: number = 100;

  constructor(
    config: DashboardConfig,
    database: DatabaseManager,
    auth: AuthManager,
    logger: Logger
  ) {
    this.config = config;
    this.database = database;
    this.auth = auth;
    this.logger = logger;
  }

  /**
   * Initialize SQL editor
   */
  async initialize(): Promise<void> {
    this.logger.info('SQL editor initialized');
  }

  /**
   * Start SQL editor (part of dashboard)
   */
  async start(): Promise<void> {
    // SQL editor is served as part of the dashboard
    this.logger.debug('SQL editor ready');
  }

  /**
   * Stop SQL editor
   */
  async stop(): Promise<void> {
    this.logger.debug('SQL editor stopped');
  }

  /**
   * Execute SQL query
   */
  async executeQuery(
    query: string,
    userId?: string
  ): Promise<{
    data: any[];
    columns: string[];
    rowCount: number;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Validate query (basic security)
      this.validateQuery(query);

      // Check user permissions
      if (userId) {
        const user = await this.auth.getUser(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('Insufficient permissions');
        }
      }

      // Execute query
      const result = await this.database.query(query);

      const duration = Date.now() - startTime;
      const rows = result.rows?.length || 0;

      // Get column names
      const columns = result.rows && result.rows.length > 0
        ? Object.keys(result.rows[0])
        : [];

      // Add to history
      this.addToHistory({
        id: this.generateId(),
        query,
        timestamp: new Date(),
        duration,
        rows
      });

      this.logger.info(`SQL query executed in ${duration}ms (${rows} rows)`);

      return {
        data: result.rows || [],
        columns,
        rowCount: rows,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Add to history with error
      this.addToHistory({
        id: this.generateId(),
        query,
        timestamp: new Date(),
        duration,
        rows: 0,
        error: errorMessage
      });

      this.logger.error('SQL query failed:', error);

      return {
        data: [],
        columns: [],
        rowCount: 0,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * Validate SQL query for security
   */
  private validateQuery(query: string): void {
    const normalized = query.toLowerCase().trim();

    // Block dangerous operations
    const dangerousPatterns = [
      /drop\s+database/i,
      /drop\s+schema/i,
      /grant\s+/i,
      /revoke\s+/i,
      /alter\s+user/i,
      /create\s+user/i,
      /drop\s+user/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(normalized)) {
        throw new Error('Query contains dangerous operations');
      }
    }

    // Warn about write operations
    if (normalized.startsWith('insert') ||
        normalized.startsWith('update') ||
        normalized.startsWith('delete') ||
        normalized.startsWith('drop') ||
        normalized.startsWith('truncate')) {
      this.logger.warn('Executing write operation via SQL editor');
    }
  }

  /**
   * Add query to history
   */
  private addToHistory(entry: QueryHistory): void {
    this.history.unshift(entry);

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
  }

  /**
   * Get query history
   */
  getHistory(limit?: number): QueryHistory[] {
    return limit ? this.history.slice(0, limit) : this.history;
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.history = [];
    this.logger.info('Query history cleared');
  }

  /**
   * Get table schema for autocomplete
   */
  async getTableSchema(tableName: string): Promise<any> {
    try {
      const table = await this.database.getTable(tableName);
      return {
        name: table.name,
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable
        }))
      };
    } catch (error) {
      this.logger.error(`Failed to get table schema: ${tableName}`, error);
      return null;
    }
  }

  /**
   * Get all table names for autocomplete
   */
  async getTableNames(): Promise<string[]> {
    try {
      const tables = await this.database.getTables();
      return tables.map(t => t.name);
    } catch (error) {
      this.logger.error('Failed to get table names', error);
      return [];
    }
  }

  /**
   * Format SQL query
   */
  formatQuery(query: string): string {
    // Basic SQL formatting
    let formatted = query
      .replace(/\s+/g, ' ')
      .trim();

    // Add newlines after keywords
    const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT'];
    for (const keyword of keywords) {
      const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword} `);
    }

    return formatted;
  }

  /**
   * Explain query plan
   */
  async explainQuery(query: string): Promise<any> {
    try {
      const explainQuery = `EXPLAIN ${query}`;
      const result = await this.database.query(explainQuery);

      return {
        plan: result.rows || [],
        success: true
      };
    } catch (error) {
      this.logger.error('Failed to explain query', error);
      return {
        plan: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
