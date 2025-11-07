/**
 * Storage Manager
 *
 * Handles file storage, buckets, and CDN
 * Supports local filesystem, S3, and Google Cloud Storage
 */

import { DatabaseManager } from '../database/manager';
import { AuthManager } from '../auth/manager';
import { StorageConfig, Bucket, StorageObject } from '../types';
import { FileStorage } from './file-storage';
import { CDNServer } from './cdn';
import { ImageTransformer } from './transformations';
import { Logger } from '../utils/logger';

/**
 * Storage manager
 */
export class StorageManager {
  private config: StorageConfig;
  private database: DatabaseManager;
  private auth: AuthManager;
  private logger: Logger;
  private fileStorage: FileStorage;
  private cdn?: CDNServer;
  private transformer?: ImageTransformer;
  private stats = {
    uploads: 0,
    downloads: 0,
    deletes: 0,
    bytesUploaded: 0,
    bytesDownloaded: 0
  };

  constructor(
    config: StorageConfig,
    database: DatabaseManager,
    auth: AuthManager,
    logger: Logger
  ) {
    this.config = config;
    this.database = database;
    this.auth = auth;
    this.logger = logger;
    this.fileStorage = new FileStorage(config, logger);
  }

  /**
   * Initialize storage manager
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing storage manager...');

    await this.fileStorage.initialize();

    if (this.config.cdn?.enabled) {
      this.cdn = new CDNServer(this.config.cdn, this.fileStorage, this.logger);
      await this.cdn.initialize();
    }

    if (this.config.transformations?.enabled) {
      this.transformer = new ImageTransformer(this.config.transformations, this.logger);
      await this.transformer.initialize();
    }

    this.logger.info('Storage manager initialized');
  }

  /**
   * Create a new bucket
   */
  async createBucket(
    name: string,
    isPublic: boolean = false,
    fileSizeLimit?: number,
    allowedMimeTypes?: string[]
  ): Promise<Bucket> {
    // Validate bucket name
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error('Bucket name must be lowercase alphanumeric with hyphens');
    }

    // Check if bucket already exists
    const existing = await this.database.select({
      table: 'storage_buckets',
      filter: [{ column: 'name', operator: 'eq', value: name }]
    });

    if (existing.data.length > 0) {
      throw new Error('Bucket already exists');
    }

    const bucketId = this.generateId();
    const now = new Date().toISOString();

    const bucketData = {
      id: bucketId,
      name,
      public: isPublic ? 1 : 0,
      file_size_limit: fileSizeLimit || this.config.maxFileSize,
      allowed_mime_types: allowedMimeTypes ? JSON.stringify(allowedMimeTypes) : null,
      created_at: now,
      updated_at: now
    };

    await this.database.insert('storage_buckets', bucketData);

    // Create bucket directory
    await this.fileStorage.createBucket(name);

    this.logger.info(`Bucket created: ${name}`);

    return {
      id: bucketId,
      name,
      public: isPublic,
      fileSizeLimit,
      allowedMimeTypes,
      policies: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get bucket by name
   */
  async getBucket(name: string): Promise<Bucket | null> {
    const result = await this.database.select({
      table: 'storage_buckets',
      filter: [{ column: 'name', operator: 'eq', value: name }]
    });

    if (result.data.length === 0) {
      return null;
    }

    const data = result.data[0];

    return {
      id: data.id,
      name: data.name,
      public: Boolean(data.public),
      fileSizeLimit: data.file_size_limit,
      allowedMimeTypes: data.allowed_mime_types ? JSON.parse(data.allowed_mime_types) : undefined,
      policies: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Upload a file
   */
  async upload(
    bucket: string,
    path: string,
    content: Buffer | ReadableStream,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<StorageObject> {
    // Get bucket
    const bucketData = await this.getBucket(bucket);
    if (!bucketData) {
      throw new Error('Bucket not found');
    }

    // Validate file size
    const size = content instanceof Buffer ? content.length : 0;
    if (size > (bucketData.fileSizeLimit || this.config.maxFileSize)) {
      throw new Error('File too large');
    }

    // Detect MIME type
    const mimeType = this.detectMimeType(path, metadata);

    // Validate MIME type
    if (bucketData.allowedMimeTypes && !bucketData.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`MIME type ${mimeType} not allowed in this bucket`);
    }

    // Upload file
    await this.fileStorage.upload(bucket, path, content);

    // Create database record
    const objectId = this.generateId();
    const now = new Date().toISOString();

    const objectData = {
      id: objectId,
      bucket_id: bucketData.id,
      name: this.getFileName(path),
      path,
      size,
      mime_type: mimeType,
      metadata: metadata ? JSON.stringify(metadata) : null,
      owner_id: userId || null,
      public: bucketData.public ? 1 : 0,
      created_at: now,
      updated_at: now
    };

    await this.database.insert('storage_objects', objectData);

    this.stats.uploads++;
    this.stats.bytesUploaded += size;

    this.logger.info(`File uploaded: ${bucket}/${path} (${size} bytes)`);

    return {
      id: objectId,
      bucket,
      name: this.getFileName(path),
      path,
      size,
      mimeType,
      metadata: metadata || {},
      ownerId: userId,
      public: bucketData.public,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Download a file
   */
  async download(bucket: string, path: string, userId?: string): Promise<Buffer> {
    // Get object from database
    const result = await this.database.select({
      table: 'storage_objects',
      filter: [
        { column: 'path', operator: 'eq', value: path }
      ]
    });

    if (result.data.length === 0) {
      throw new Error('File not found');
    }

    const objectData = result.data[0];

    // Check permissions
    if (!objectData.public) {
      if (!userId || (objectData.owner_id && objectData.owner_id !== userId)) {
        throw new Error('Access denied');
      }
    }

    // Download file
    const content = await this.fileStorage.download(bucket, path);

    this.stats.downloads++;
    this.stats.bytesDownloaded += content.length;

    return content;
  }

  /**
   * Delete a file
   */
  async delete(bucket: string, path: string, userId?: string): Promise<void> {
    // Get object from database
    const result = await this.database.select({
      table: 'storage_objects',
      filter: [
        { column: 'path', operator: 'eq', value: path }
      ]
    });

    if (result.data.length === 0) {
      throw new Error('File not found');
    }

    const objectData = result.data[0];

    // Check permissions
    if (objectData.owner_id && objectData.owner_id !== userId) {
      const user = userId ? await this.auth.getUser(userId) : null;
      if (!user || user.role !== 'admin') {
        throw new Error('Access denied');
      }
    }

    // Delete file
    await this.fileStorage.delete(bucket, path);

    // Delete database record
    await this.database.delete('storage_objects', objectData.id);

    this.stats.deletes++;

    this.logger.info(`File deleted: ${bucket}/${path}`);
  }

  /**
   * List files in a bucket
   */
  async list(
    bucket: string,
    prefix?: string,
    limit?: number,
    offset?: number
  ): Promise<StorageObject[]> {
    const filters: any[] = [];

    // Get bucket
    const bucketData = await this.getBucket(bucket);
    if (!bucketData) {
      throw new Error('Bucket not found');
    }

    filters.push({ column: 'bucket_id', operator: 'eq', value: bucketData.id });

    if (prefix) {
      filters.push({ column: 'path', operator: 'like', value: `${prefix}%` });
    }

    const result = await this.database.select({
      table: 'storage_objects',
      filter: filters,
      limit,
      offset
    });

    return result.data.map((data: any) => ({
      id: data.id,
      bucket,
      name: data.name,
      path: data.path,
      size: data.size,
      mimeType: data.mime_type,
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
      ownerId: data.owner_id,
      public: Boolean(data.public),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }));
  }

  /**
   * Transform an image
   */
  async transform(
    bucket: string,
    path: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): Promise<Buffer> {
    if (!this.transformer) {
      throw new Error('Image transformations not enabled');
    }

    // Download original image
    const original = await this.download(bucket, path);

    // Transform image
    return await this.transformer.transform(original, options);
  }

  /**
   * Start CDN server
   */
  async startCDN(): Promise<void> {
    if (this.cdn) {
      await this.cdn.start();
    }
  }

  /**
   * Stop CDN server
   */
  async stopCDN(): Promise<void> {
    if (this.cdn) {
      await this.cdn.stop();
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return {
      status: 'healthy',
      provider: this.config.provider,
      cdn: this.cdn ? await this.cdn.getHealth() : null
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    return {
      uploads: this.stats.uploads,
      downloads: this.stats.downloads,
      deletes: this.stats.deletes,
      bytesUploaded: this.stats.bytesUploaded,
      bytesDownloaded: this.stats.bytesDownloaded
    };
  }

  /**
   * Detect MIME type from file path or metadata
   */
  private detectMimeType(path: string, metadata?: Record<string, any>): string {
    if (metadata?.mimeType) {
      return metadata.mimeType;
    }

    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      txt: 'text/plain',
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
      zip: 'application/zip'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Get file name from path
   */
  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
