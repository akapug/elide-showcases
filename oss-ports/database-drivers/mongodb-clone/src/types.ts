/**
 * MongoDB type definitions
 */

export type ObjectId = string;
export type Document = Record<string, any>;
export type Filter<T = Document> = Partial<T> & Record<string, any>;
export type Update<T = Document> = Partial<T> | Record<string, any>;
export type Sort = Record<string, 1 | -1 | { $meta: string }>;
export type Projection = Record<string, 0 | 1 | boolean>;

export interface MongoClientOptions {
  appName?: string;
  auth?: AuthOptions;
  authMechanism?: string;
  authSource?: string;
  compressors?: string[];
  connectTimeoutMS?: number;
  directConnection?: boolean;
  heartbeatFrequencyMS?: number;
  localThresholdMS?: number;
  maxIdleTimeMS?: number;
  maxPoolSize?: number;
  minPoolSize?: number;
  maxConnecting?: number;
  readConcern?: ReadConcern;
  readPreference?: ReadPreference;
  replicaSet?: string;
  retryReads?: boolean;
  retryWrites?: boolean;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  ssl?: boolean;
  tls?: boolean;
  tlsAllowInvalidCertificates?: boolean;
  tlsAllowInvalidHostnames?: boolean;
  w?: number | 'majority';
  writeConcern?: WriteConcern;
  zlibCompressionLevel?: number;
}

export interface AuthOptions {
  username: string;
  password: string;
}

export interface ReadConcern {
  level: 'local' | 'available' | 'majority' | 'linearizable' | 'snapshot';
}

export interface ReadPreference {
  mode: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  tags?: Record<string, string>[];
  maxStalenessSeconds?: number;
}

export interface WriteConcern {
  w?: number | 'majority';
  j?: boolean;
  wtimeout?: number;
}

export interface InsertOneResult {
  acknowledged: boolean;
  insertedId: ObjectId;
}

export interface InsertManyResult {
  acknowledged: boolean;
  insertedCount: number;
  insertedIds: Record<number, ObjectId>;
}

export interface UpdateResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedId?: ObjectId;
}

export interface DeleteResult {
  acknowledged: boolean;
  deletedCount: number;
}

export interface BulkWriteResult {
  acknowledged: boolean;
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  upsertedIds: Record<number, ObjectId>;
  insertedIds: Record<number, ObjectId>;
}

export interface FindOptions {
  limit?: number;
  skip?: number;
  sort?: Sort;
  projection?: Projection;
  batchSize?: number;
  collation?: Collation;
  hint?: string | Document;
  max?: Document;
  maxTimeMS?: number;
  min?: Document;
  noCursorTimeout?: boolean;
  returnKey?: boolean;
  showRecordId?: boolean;
}

export interface AggregateOptions {
  allowDiskUse?: boolean;
  batchSize?: number;
  bypassDocumentValidation?: boolean;
  collation?: Collation;
  comment?: string;
  hint?: string | Document;
  let?: Document;
  maxTimeMS?: number;
}

export interface UpdateOptions {
  upsert?: boolean;
  bypassDocumentValidation?: boolean;
  collation?: Collation;
  hint?: string | Document;
  arrayFilters?: Document[];
}

export interface DeleteOptions {
  collation?: Collation;
  hint?: string | Document;
}

export interface IndexDescription {
  key: Record<string, 1 | -1 | '2d' | '2dsphere' | 'text' | 'hashed'>;
  name?: string;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Document;
  weights?: Record<string, number>;
  default_language?: string;
  language_override?: string;
  textIndexVersion?: number;
  '2dsphereIndexVersion'?: number;
  bits?: number;
  min?: number;
  max?: number;
  bucketSize?: number;
  collation?: Collation;
}

export interface Collation {
  locale: string;
  caseLevel?: boolean;
  caseFirst?: 'upper' | 'lower' | 'off';
  strength?: number;
  numericOrdering?: boolean;
  alternate?: 'non-ignorable' | 'shifted';
  maxVariable?: 'punct' | 'space';
  backwards?: boolean;
  normalization?: boolean;
}

export interface ChangeStreamOptions {
  batchSize?: number;
  collation?: Collation;
  fullDocument?: 'default' | 'updateLookup';
  fullDocumentBeforeChange?: 'whenAvailable' | 'required';
  maxAwaitTimeMS?: number;
  resumeAfter?: Document;
  startAfter?: Document;
  startAtOperationTime?: Date;
}

export interface ChangeStreamDocument<T = Document> {
  _id: Document;
  operationType: 'insert' | 'update' | 'replace' | 'delete' | 'invalidate' | 'drop' | 'dropDatabase' | 'rename';
  fullDocument?: T;
  fullDocumentBeforeChange?: T;
  ns: { db: string; coll: string };
  to?: { db: string; coll: string };
  documentKey?: { _id: ObjectId };
  updateDescription?: {
    updatedFields: Document;
    removedFields: string[];
    truncatedArrays?: Array<{ field: string; newSize: number }>;
  };
  clusterTime: Date;
  txnNumber?: number;
  lsid?: Document;
}

export interface SessionOptions {
  causalConsistency?: boolean;
  defaultTransactionOptions?: TransactionOptions;
}

export interface TransactionOptions {
  readConcern?: ReadConcern;
  writeConcern?: WriteConcern;
  readPreference?: ReadPreference;
  maxCommitTimeMS?: number;
}

export interface GridFSBucketOptions {
  bucketName?: string;
  chunkSizeBytes?: number;
  writeConcern?: WriteConcern;
  readPreference?: ReadPreference;
}

export interface GridFSFile {
  _id: ObjectId;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  filename: string;
  metadata?: Document;
  contentType?: string;
  aliases?: string[];
}

export interface BulkOperation {
  insertOne?: { document: Document };
  updateOne?: { filter: Filter; update: Update; upsert?: boolean; arrayFilters?: Document[]; hint?: string | Document };
  updateMany?: { filter: Filter; update: Update; upsert?: boolean; arrayFilters?: Document[]; hint?: string | Document };
  replaceOne?: { filter: Filter; replacement: Document; upsert?: boolean; hint?: string | Document };
  deleteOne?: { filter: Filter; hint?: string | Document };
  deleteMany?: { filter: Filter; hint?: string | Document };
}

export interface CommandOptions {
  readPreference?: ReadPreference;
  session?: any;
  comment?: string;
}

export interface ListDatabasesResult {
  databases: Array<{
    name: string;
    sizeOnDisk: number;
    empty: boolean;
  }>;
  totalSize: number;
}

export interface ListCollectionsResult {
  name: string;
  type: 'collection' | 'view';
  options: Document;
  info: {
    readOnly: boolean;
    uuid: string;
  };
  idIndex: Document;
}

export interface CollectionStats {
  ns: string;
  size: number;
  count: number;
  avgObjSize: number;
  storageSize: number;
  freeStorageSize: number;
  nindexes: number;
  totalIndexSize: number;
  totalSize: number;
  indexSizes: Record<string, number>;
}

export interface DatabaseStats {
  db: string;
  collections: number;
  views: number;
  objects: number;
  avgObjSize: number;
  dataSize: number;
  storageSize: number;
  freeStorageSize: number;
  indexes: number;
  indexSize: number;
  totalSize: number;
  scaleFactor: number;
  fsUsedSize: number;
  fsTotalSize: number;
}

export class MongoError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'MongoError';
  }
}

export class MongoServerError extends MongoError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'MongoServerError';
  }
}

export class MongoNetworkError extends MongoError {
  constructor(message: string) {
    super(message);
    this.name = 'MongoNetworkError';
  }
}

export class MongoTimeoutError extends MongoError {
  constructor(message: string) {
    super(message);
    this.name = 'MongoTimeoutError';
  }
}
