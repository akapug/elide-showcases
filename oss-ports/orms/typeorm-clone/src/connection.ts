/**
 * Database connection management
 */

import { EntityManager } from './entity-manager';
import { Repository } from './repository';
import { QueryRunner } from './query-runner';

export interface ConnectionOptions {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
  entities?: Function[];
  migrations?: Function[];
  subscribers?: Function[];
  synchronize?: boolean;
  migrationsRun?: boolean;
  logging?: boolean | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log')[];
  logger?: 'simple-console' | 'advanced-console' | 'file';
  extra?: any;
  cache?: boolean | {
    type: 'memory' | 'redis' | 'database';
    options?: any;
  };
  entitySkipConstructor?: boolean;
  namingStrategy?: any;
}

export class DataSource {
  private _isConnected: boolean = false;
  private _entityManager?: EntityManager;
  private _repositories: Map<Function, Repository<any>> = new Map();

  constructor(public options: ConnectionOptions) {}

  async initialize(): Promise<this> {
    this._entityManager = new EntityManager(this);
    this._isConnected = true;

    if (this.options.synchronize) {
      await this.synchronize();
    }

    if (this.options.migrationsRun) {
      await this.runMigrations();
    }

    return this;
  }

  async destroy(): Promise<void> {
    this._repositories.clear();
    this._isConnected = false;
  }

  get manager(): EntityManager {
    if (!this._entityManager) {
      throw new Error('Connection not initialized');
    }
    return this._entityManager;
  }

  getRepository<Entity>(entity: Function): Repository<Entity> {
    if (!this._repositories.has(entity)) {
      this._repositories.set(entity, new Repository(entity, this.manager));
    }
    return this._repositories.get(entity)!;
  }

  createQueryRunner(): QueryRunner {
    return new QueryRunner(this);
  }

  async synchronize(): Promise<void> {
    // Schema synchronization logic
  }

  async runMigrations(): Promise<void> {
    // Run migrations logic
  }

  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.manager.query(sql, parameters);
  }

  async transaction<T>(runInTransaction: (entityManager: EntityManager) => Promise<T>): Promise<T> {
    return this.manager.transaction(runInTransaction);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
}

// Connection manager
class ConnectionManager {
  private connections: Map<string, DataSource> = new Map();

  create(options: ConnectionOptions): DataSource {
    const name = options.name || 'default';
    const connection = new DataSource(options);
    this.connections.set(name, connection);
    return connection;
  }

  get(name: string = 'default'): DataSource {
    const connection = this.connections.get(name);
    if (!connection) {
      throw new Error(`Connection "${name}" not found`);
    }
    return connection;
  }

  has(name: string = 'default'): boolean {
    return this.connections.has(name);
  }
}

const connectionManager = new ConnectionManager();

export function getConnectionManager(): ConnectionManager {
  return connectionManager;
}

export async function createConnection(options: ConnectionOptions): Promise<DataSource> {
  const connection = connectionManager.create(options);
  await connection.initialize();
  return connection;
}

export function getConnection(name?: string): DataSource {
  return connectionManager.get(name);
}
