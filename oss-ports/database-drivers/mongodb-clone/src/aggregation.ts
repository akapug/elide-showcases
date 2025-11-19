import * as types from './types';

export class AggregationCursor<T = types.Document> {
  private collection: any;
  private pipeline: types.Document[];
  private options: types.AggregateOptions;

  constructor(collection: any, pipeline: types.Document[], options: types.AggregateOptions = {}) {
    this.collection = collection;
    this.pipeline = pipeline;
    this.options = options;
  }

  async toArray(): Promise<T[]> {
    const command: any = {
      aggregate: this.collection.collectionName,
      pipeline: this.pipeline,
      cursor: { batchSize: this.options.batchSize || 1000 },
      ...this.options
    };

    const result = await this.collection['executeCommand'](command);
    return result.cursor?.firstBatch || [];
  }

  async next(): Promise<T | null> {
    const docs = await this.toArray();
    return docs[0] || null;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    let docs: T[];
    let index = 0;

    return {
      next: async () => {
        if (!docs) docs = await this.toArray();
        if (index < docs.length) return { value: docs[index++], done: false };
        return { value: undefined as any, done: true };
      }
    };
  }
}
