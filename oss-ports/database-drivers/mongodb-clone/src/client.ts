/**
 * MongoDB Client implementation
 */

import * as types from './types';
import { Database } from './database';

export class MongoClient {
  private url: string;
  private options: types.MongoClientOptions;
  private connection: any;
  private connected: boolean = false;
  private databases: Map<string, Database> = new Map();

  constructor(url: string, options: types.MongoClientOptions = {}) {
    this.url = url;
    this.options = {
      maxPoolSize: 100,
      minPoolSize: 0,
      maxIdleTimeMS: 0,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 0,
      serverSelectionTimeoutMS: 30000,
      retryReads: true,
      retryWrites: true,
      ...options
    };
  }

  async connect(): Promise<this> {
    if (this.connected) return this;
    this.connection = await this.nativeConnect(this.url, this.options);
    this.connected = true;
    return this;
  }

  async close(force: boolean = false): Promise<void> {
    if (!this.connected) return;
    await this.nativeClose(this.connection, force);
    this.connected = false;
    this.databases.clear();
  }

  db(name: string, options?: types.CommandOptions): Database {
    if (!this.databases.has(name)) {
      this.databases.set(name, new Database(this, name, options));
    }
    return this.databases.get(name)!;
  }

  async listDatabases(options?: types.CommandOptions): Promise<types.ListDatabasesResult> {
    return this.nativeCommand(this.connection, { listDatabases: 1 }, options);
  }

  startSession(options?: types.SessionOptions): any {
    return this.nativeStartSession(this.connection, options);
  }

  watch(pipeline?: types.Document[], options?: types.ChangeStreamOptions): any {
    return this.nativeWatch(this.connection, pipeline, options);
  }

  get topology(): any {
    return this.nativeGetTopology(this.connection);
  }

  private nativeConnect(url: string, options: types.MongoClientOptions): Promise<any> {
    return (globalThis as any).__elide_mongo_connect?.(url, options) || Promise.resolve({ mock: true });
  }

  private nativeClose(connection: any, force: boolean): Promise<void> {
    return (globalThis as any).__elide_mongo_close?.(connection, force) || Promise.resolve();
  }

  private nativeCommand(connection: any, command: types.Document, options?: types.CommandOptions): Promise<any> {
    return (globalThis as any).__elide_mongo_command?.(connection, command, options) || Promise.resolve({});
  }

  private nativeStartSession(connection: any, options?: types.SessionOptions): any {
    return (globalThis as any).__elide_mongo_start_session?.(connection, options) || { mock: true };
  }

  private nativeWatch(connection: any, pipeline?: types.Document[], options?: types.ChangeStreamOptions): any {
    return (globalThis as any).__elide_mongo_watch?.(connection, pipeline, options) || { mock: true };
  }

  private nativeGetTopology(connection: any): any {
    return (globalThis as any).__elide_mongo_topology?.(connection) || {};
  }

  _getConnection(): any {
    return this.connection;
  }
}
