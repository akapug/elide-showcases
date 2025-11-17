/**
 * PostgreSQL Client implementation
 */

import * as types from './types';
import { Connection } from './connection';
import { PreparedStatement } from './prepared';

export { ClientConfig } from './types';

export class Client {
  private config: types.ClientConfig;
  private connection: Connection | null = null;
  private connected: boolean = false;
  private _activeQuery: boolean = false;
  private preparedStatements: Map<string, PreparedStatement> = new Map();
  private notificationHandlers: Map<string, Set<types.NotificationHandler>> = new Map();

  constructor(config: types.ClientConfig | string) {
    if (typeof config === 'string') {
      this.config = this.parseConnectionString(config);
    } else {
      this.config = {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: process.env.USER || 'postgres',
        ...config
      };
    }
  }

  private parseConnectionString(connString: string): types.ClientConfig {
    const url = new URL(connString);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password
    };
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    this.connection = new Connection(this.config);
    await this.connection.connect();
    this.connected = true;

    // Setup notification handler
    if (this.connection) {
      this.connection.on('notification', (notification: types.Notification) => {
        this.handleNotification(notification);
      });
    }
  }

  async query<T = any>(text: string, values?: any[]): Promise<types.QueryResult<T>>;
  async query<T = any>(config: types.QueryConfig): Promise<types.QueryResult<T>>;
  async query<T = any>(textOrConfig: string | types.QueryConfig, values?: any[]): Promise<types.QueryResult<T>> {
    if (!this.connected || !this.connection) {
      throw new types.ConnectionError('Client is not connected');
    }

    const config: types.QueryConfig = typeof textOrConfig === 'string'
      ? { text: textOrConfig, values }
      : textOrConfig;

    this._activeQuery = true;

    try {
      const result = await this.connection.query(config);
      return result as types.QueryResult<T>;
    } finally {
      this._activeQuery = false;
    }
  }

  async prepare(name: string, text: string, paramCount?: number): Promise<PreparedStatement> {
    if (this.preparedStatements.has(name)) {
      return this.preparedStatements.get(name)!;
    }

    const stmt = new PreparedStatement(this, name, text, paramCount);
    await stmt.prepare();
    this.preparedStatements.set(name, stmt);
    return stmt;
  }

  async execute<T = any>(name: string, values: any[]): Promise<types.QueryResult<T>> {
    const stmt = this.preparedStatements.get(name);
    if (!stmt) {
      throw new Error(`Prepared statement "${name}" not found`);
    }
    return stmt.execute<T>(values);
  }

  async listen(channel: string, handler: types.NotificationHandler): Promise<void> {
    await this.query(`LISTEN ${channel}`);
    
    if (!this.notificationHandlers.has(channel)) {
      this.notificationHandlers.set(channel, new Set());
    }
    this.notificationHandlers.get(channel)!.add(handler);
  }

  async unlisten(channel: string, handler?: types.NotificationHandler): Promise<void> {
    if (handler) {
      const handlers = this.notificationHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          await this.query(`UNLISTEN ${channel}`);
          this.notificationHandlers.delete(channel);
        }
      }
    } else {
      await this.query(`UNLISTEN ${channel}`);
      this.notificationHandlers.delete(channel);
    }
  }

  async notify(channel: string, payload?: string): Promise<void> {
    const escapedPayload = payload ? `'${payload.replace(/'/g, "''")}'` : '';
    await this.query(`NOTIFY ${channel}${payload ? `, ${escapedPayload}` : ''}`);
  }

  private handleNotification(notification: types.Notification): void {
    const handlers = this.notificationHandlers.get(notification.channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(notification);
        } catch (error) {
          console.error('Error in notification handler:', error);
        }
      }
    }
  }

  async copyFrom(query: string): Promise<any> {
    if (!this.connection) throw new types.ConnectionError('Not connected');
    return this.connection.copyFrom(query);
  }

  async copyTo(query: string): Promise<any> {
    if (!this.connection) throw new types.ConnectionError('Not connected');
    return this.connection.copyTo(query);
  }

  async begin(): Promise<void> {
    await this.query('BEGIN');
  }

  async commit(): Promise<void> {
    await this.query('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.query('ROLLBACK');
  }

  async savepoint(name: string): Promise<void> {
    await this.query(`SAVEPOINT ${name}`);
  }

  async releaseSavepoint(name: string): Promise<void> {
    await this.query(`RELEASE SAVEPOINT ${name}`);
  }

  async rollbackTo(name: string): Promise<void> {
    await this.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }

  async transaction<T>(fn: (client: this) => Promise<T>): Promise<T> {
    await this.begin();
    try {
      const result = await fn(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  async end(): Promise<void> {
    if (!this.connected || !this.connection) return;

    // Close all prepared statements
    for (const stmt of this.preparedStatements.values()) {
      await stmt.close();
    }
    this.preparedStatements.clear();

    // Close connection
    await this.connection.close();
    this.connection = null;
    this.connected = false;
  }

  get activeQuery(): boolean {
    return this._activeQuery;
  }

  get database(): string | undefined {
    return this.config.database;
  }

  get user(): string | undefined {
    return this.config.user;
  }

  get host(): string | undefined {
    return this.config.host;
  }

  get port(): number | undefined {
    return this.config.port;
  }

  get processID(): number | undefined {
    return this.connection?.processID;
  }

  get secretKey(): number | undefined {
    return this.connection?.secretKey;
  }
}
