/**
 * @elide/mongodb - Production-ready MongoDB driver for Elide
 *
 * Complete MongoDB protocol implementation with:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Aggregation pipeline with all stages
 * - Index management
 * - Transactions and sessions
 * - Change streams for real-time updates
 * - GridFS for file storage
 * - Connection pooling
 * - Replica set support
 * - Full TypeScript support
 */

export { MongoClient } from './client';
export { Database } from './database';
export { Collection } from './collection';
export { Cursor } from './cursor';
export { AggregationCursor } from './aggregation';
export { ChangeStream } from './change-stream';
export { GridFSBucket } from './gridfs';
export { ClientSession } from './session';
export * from './types';

import { MongoClient } from './client';
export default MongoClient;

/**
 * Create a new MongoDB client
 */
export function connect(url: string, options?: any): MongoClient {
  return new MongoClient(url, options);
}
