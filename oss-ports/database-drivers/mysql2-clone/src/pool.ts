import * as types from './types';
import { Connection } from './connection';

export interface PoolOptions extends types.ConnectionConfig {
  waitForConnections?: boolean;
  connectionLimit?: number;
  maxIdle?: number;
  idleTimeout?: number;
  queueLimit?: number;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

export class Pool {
  private config: PoolOptions;
  private connections: Connection[] = [];
  private idleConnections: Connection[] = [];
  private waitQueue: Array<{ resolve: Function; reject: Function }> = [];
  private ending: boolean = false;

  constructor(config: PoolOptions) {
    this.config = { connectionLimit: 10, queueLimit: 0, waitForConnections: true, ...config };
  }

  async getConnection(): Promise<Connection> {
    if (this.ending) throw new Error('Pool is ending');
    const idle = this.idleConnections.pop();
    if (idle) return idle;
    if (this.connections.length < this.config.connectionLimit!) {
      const conn = new Connection(this.config);
      await conn.connect();
      this.connections.push(conn);
      return conn;
    }
    if (!this.config.waitForConnections) throw new Error('No connections available');
    return new Promise((resolve, reject) => this.waitQueue.push({ resolve, reject }));
  }

  releaseConnection(connection: Connection): void {
    if (this.ending) { connection.end(); return; }
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()!;
      waiter.resolve(connection);
    } else {
      this.idleConnections.push(connection);
    }
  }

  async query(sql: string, values?: any[]): Promise<any> {
    const conn = await this.getConnection();
    try { return await conn.query(sql, values); }
    finally { this.releaseConnection(conn); }
  }

  async execute(sql: string, values?: any[]): Promise<any> {
    const conn = await this.getConnection();
    try { return await conn.execute(sql, values); }
    finally { this.releaseConnection(conn); }
  }

  async end(): Promise<void> {
    this.ending = true;
    await Promise.all(this.connections.map(c => c.end()));
    this.connections = [];
    this.idleConnections = [];
  }

  get poolSize(): number { return this.connections.length; }
  get idleSize(): number { return this.idleConnections.length; }
  get queueSize(): number { return this.waitQueue.length; }
}
