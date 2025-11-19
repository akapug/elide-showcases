import * as types from './types';
import { Collection } from './collection';

export class Database {
  private client: any;
  private name: string;
  private options: types.CommandOptions;
  private collections: Map<string, Collection> = new Map();

  constructor(client: any, name: string, options: types.CommandOptions = {}) {
    this.client = client;
    this.name = name;
    this.options = options;
  }

  collection<T = types.Document>(name: string): Collection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection(this, name));
    }
    return this.collections.get(name)! as Collection<T>;
  }

  async command(command: types.Document, options?: types.CommandOptions): Promise<any> {
    const conn = this.client._getConnection();
    return (globalThis as any).__elide_mongo_db_command?.(conn, this.name, command, options) || {};
  }

  async createCollection(name: string, options?: types.Document): Promise<Collection> {
    await this.command({ create: name, ...options });
    return this.collection(name);
  }

  async dropCollection(name: string): Promise<boolean> {
    try {
      await this.command({ drop: name });
      this.collections.delete(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listCollections(filter?: types.Filter, options?: types.CommandOptions): Promise<types.ListCollectionsResult[]> {
    const result = await this.command({ listCollections: 1, filter, ...options });
    return result.cursor?.firstBatch || [];
  }

  async stats(options?: types.CommandOptions): Promise<types.DatabaseStats> {
    return this.command({ dbStats: 1, scale: 1, ...options });
  }

  async dropDatabase(): Promise<boolean> {
    await this.command({ dropDatabase: 1 });
    this.collections.clear();
    return true;
  }

  async createIndex(collection: string, indexSpec: types.IndexDescription): Promise<string> {
    const coll = this.collection(collection);
    return coll.createIndex(indexSpec.key, indexSpec);
  }

  get databaseName(): string {
    return this.name;
  }
}
