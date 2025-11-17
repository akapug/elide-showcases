import * as types from './types';

export class Cursor<T = types.Document> {
  private collection: any;
  private filter: types.Filter<T>;
  private options: types.FindOptions;
  private _limit?: number;
  private _skip?: number;
  private _sort?: types.Sort;
  private _projection?: types.Projection;
  private executed: boolean = false;

  constructor(collection: any, filter: types.Filter<T>, options: types.FindOptions = {}) {
    this.collection = collection;
    this.filter = filter;
    this.options = options;
    this._limit = options.limit;
    this._skip = options.skip;
    this._sort = options.sort;
    this._projection = options.projection;
  }

  limit(value: number): this {
    this._limit = value;
    return this;
  }

  skip(value: number): this {
    this._skip = value;
    return this;
  }

  sort(value: types.Sort): this {
    this._sort = value;
    return this;
  }

  project(value: types.Projection): this {
    this._projection = value;
    return this;
  }

  async toArray(): Promise<T[]> {
    if (this.executed) throw new Error('Cursor already executed');
    this.executed = true;

    const command: any = {
      find: this.collection.collectionName,
      filter: this.filter
    };

    if (this._limit) command.limit = this._limit;
    if (this._skip) command.skip = this._skip;
    if (this._sort) command.sort = this._sort;
    if (this._projection) command.projection = this._projection;

    const result = await this.collection['executeCommand'](command);
    return result.cursor?.firstBatch || [];
  }

  async hasNext(): Promise<boolean> {
    const docs = await this.toArray();
    return docs.length > 0;
  }

  async count(): Promise<number> {
    return this.collection.countDocuments(this.filter);
  }

  async forEach(fn: (doc: T) => void): Promise<void> {
    const docs = await this.toArray();
    docs.forEach(fn);
  }

  map<U>(fn: (doc: T) => U): Cursor<U> {
    const newCursor = new Cursor<U>(this.collection, this.filter as any, this.options);
    newCursor['_transform'] = fn;
    return newCursor;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    let docs: T[];
    let index = 0;

    return {
      next: async () => {
        if (!docs) {
          docs = await this.toArray();
        }

        if (index < docs.length) {
          return { value: docs[index++], done: false };
        }

        return { value: undefined as any, done: true };
      }
    };
  }
}
