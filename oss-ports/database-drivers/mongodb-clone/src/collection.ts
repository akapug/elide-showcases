import * as types from './types';
import { Cursor } from './cursor';
import { AggregationCursor } from './aggregation';

export class Collection<T = types.Document> {
  private db: any;
  private name: string;

  constructor(db: any, name: string) {
    this.db = db;
    this.name = name;
  }

  async insertOne(doc: Partial<T>, options?: types.CommandOptions): Promise<types.InsertOneResult> {
    const result = await this.executeCommand({ insert: this.name, documents: [doc], ...options });
    return {
      acknowledged: result.ok === 1,
      insertedId: result.insertedIds?.[0] || doc._id
    };
  }

  async insertMany(docs: Partial<T>[], options?: types.CommandOptions): Promise<types.InsertManyResult> {
    const result = await this.executeCommand({ insert: this.name, documents: docs, ...options });
    return {
      acknowledged: result.ok === 1,
      insertedCount: result.n || docs.length,
      insertedIds: result.insertedIds || {}
    };
  }

  async findOne(filter: types.Filter<T> = {}, options?: types.FindOptions): Promise<T | null> {
    const cursor = this.find(filter, { ...options, limit: 1 });
    const docs = await cursor.toArray();
    return docs[0] || null;
  }

  find(filter: types.Filter<T> = {}, options?: types.FindOptions): Cursor<T> {
    return new Cursor<T>(this, filter, options);
  }

  async updateOne(filter: types.Filter<T>, update: types.Update<T>, options?: types.UpdateOptions): Promise<types.UpdateResult> {
    const result = await this.executeCommand({
      update: this.name,
      updates: [{ q: filter, u: update, multi: false, ...options }]
    });
    return {
      acknowledged: result.ok === 1,
      matchedCount: result.n || 0,
      modifiedCount: result.nModified || 0,
      upsertedCount: result.upserted ? 1 : 0,
      upsertedId: result.upserted?.[0]?._id
    };
  }

  async updateMany(filter: types.Filter<T>, update: types.Update<T>, options?: types.UpdateOptions): Promise<types.UpdateResult> {
    const result = await this.executeCommand({
      update: this.name,
      updates: [{ q: filter, u: update, multi: true, ...options }]
    });
    return {
      acknowledged: result.ok === 1,
      matchedCount: result.n || 0,
      modifiedCount: result.nModified || 0,
      upsertedCount: result.upserted?.length || 0,
      upsertedId: result.upserted?.[0]?._id
    };
  }

  async replaceOne(filter: types.Filter<T>, replacement: Partial<T>, options?: types.UpdateOptions): Promise<types.UpdateResult> {
    const result = await this.executeCommand({
      update: this.name,
      updates: [{ q: filter, u: replacement, multi: false, ...options }]
    });
    return {
      acknowledged: result.ok === 1,
      matchedCount: result.n || 0,
      modifiedCount: result.nModified || 0,
      upsertedCount: result.upserted ? 1 : 0,
      upsertedId: result.upserted?.[0]?._id
    };
  }

  async deleteOne(filter: types.Filter<T>, options?: types.DeleteOptions): Promise<types.DeleteResult> {
    const result = await this.executeCommand({
      delete: this.name,
      deletes: [{ q: filter, limit: 1, ...options }]
    });
    return {
      acknowledged: result.ok === 1,
      deletedCount: result.n || 0
    };
  }

  async deleteMany(filter: types.Filter<T>, options?: types.DeleteOptions): Promise<types.DeleteResult> {
    const result = await this.executeCommand({
      delete: this.name,
      deletes: [{ q: filter, limit: 0, ...options }]
    });
    return {
      acknowledged: result.ok === 1,
      deletedCount: result.n || 0
    };
  }

  async countDocuments(filter: types.Filter<T> = {}, options?: types.CommandOptions): Promise<number> {
    const result = await this.executeCommand({
      count: this.name,
      query: filter,
      ...options
    });
    return result.n || 0;
  }

  async estimatedDocumentCount(options?: types.CommandOptions): Promise<number> {
    const result = await this.executeCommand({ count: this.name, ...options });
    return result.n || 0;
  }

  async distinct(field: string, filter: types.Filter<T> = {}, options?: types.CommandOptions): Promise<any[]> {
    const result = await this.executeCommand({
      distinct: this.name,
      key: field,
      query: filter,
      ...options
    });
    return result.values || [];
  }

  aggregate<R = types.Document>(pipeline: types.Document[], options?: types.AggregateOptions): AggregationCursor<R> {
    return new AggregationCursor<R>(this, pipeline, options);
  }

  async createIndex(keys: types.Document, options?: types.IndexDescription): Promise<string> {
    const indexName = options?.name || Object.keys(keys).join('_');
    await this.executeCommand({
      createIndexes: this.name,
      indexes: [{ key: keys, name: indexName, ...options }]
    });
    return indexName;
  }

  async createIndexes(indexes: types.IndexDescription[]): Promise<string[]> {
    const result = await this.executeCommand({
      createIndexes: this.name,
      indexes
    });
    return result.createdCollectionAutomatically ? [] : indexes.map(i => i.name || '');
  }

  async dropIndex(indexName: string): Promise<types.Document> {
    return this.executeCommand({ dropIndexes: this.name, index: indexName });
  }

  async dropIndexes(): Promise<types.Document> {
    return this.executeCommand({ dropIndexes: this.name, index: '*' });
  }

  async listIndexes(): Promise<types.Document[]> {
    const result = await this.executeCommand({ listIndexes: this.name });
    return result.cursor?.firstBatch || [];
  }

  async stats(options?: types.CommandOptions): Promise<types.CollectionStats> {
    return this.executeCommand({ collStats: this.name, ...options });
  }

  async rename(newName: string, options?: { dropTarget?: boolean }): Promise<Collection<T>> {
    await this.executeCommand({
      renameCollection: `${this.db.databaseName}.${this.name}`,
      to: `${this.db.databaseName}.${newName}`,
      ...options
    });
    this.name = newName;
    return this;
  }

  async drop(): Promise<boolean> {
    return this.db.dropCollection(this.name);
  }

  bulkWrite(operations: types.BulkOperation[], options?: types.CommandOptions): Promise<types.BulkWriteResult> {
    return this.executeBulkWrite(operations, options);
  }

  private async executeBulkWrite(operations: types.BulkOperation[], options?: types.CommandOptions): Promise<types.BulkWriteResult> {
    const inserts: any[] = [];
    const updates: any[] = [];
    const deletes: any[] = [];

    for (const op of operations) {
      if (op.insertOne) inserts.push(op.insertOne.document);
      else if (op.updateOne) updates.push({ q: op.updateOne.filter, u: op.updateOne.update, multi: false });
      else if (op.updateMany) updates.push({ q: op.updateMany.filter, u: op.updateMany.update, multi: true });
      else if (op.deleteOne) deletes.push({ q: op.deleteOne.filter, limit: 1 });
      else if (op.deleteMany) deletes.push({ q: op.deleteMany.filter, limit: 0 });
    }

    let result: any = { insertedCount: 0, matchedCount: 0, modifiedCount: 0, deletedCount: 0, upsertedCount: 0 };

    if (inserts.length > 0) {
      const r = await this.executeCommand({ insert: this.name, documents: inserts });
      result.insertedCount = r.n || 0;
    }

    if (updates.length > 0) {
      const r = await this.executeCommand({ update: this.name, updates });
      result.matchedCount += r.n || 0;
      result.modifiedCount += r.nModified || 0;
    }

    if (deletes.length > 0) {
      const r = await this.executeCommand({ delete: this.name, deletes });
      result.deletedCount = r.n || 0;
    }

    return {
      acknowledged: true,
      ...result,
      insertedIds: {},
      upsertedIds: {}
    };
  }

  watch(pipeline?: types.Document[], options?: types.ChangeStreamOptions): any {
    return (globalThis as any).__elide_mongo_watch_collection?.(
      this.db._getConnection?.() || {},
      this.db.databaseName,
      this.name,
      pipeline,
      options
    );
  }

  private async executeCommand(command: types.Document): Promise<any> {
    return this.db.command(command);
  }

  get collectionName(): string {
    return this.name;
  }

  get namespace(): string {
    return `${this.db.databaseName}.${this.name}`;
  }
}
