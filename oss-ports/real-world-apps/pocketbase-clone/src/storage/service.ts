/**
 * File Storage Service
 * Handles file uploads, storage, and retrieval with S3 support
 */

import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import mime from 'mime-types';
import { S3 } from 'aws-sdk';
import { Collection } from '../collections/manager.js';

export interface StorageConfig {
  type: 'local' | 's3';
  basePath?: string; // For local storage
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFile {
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

export class StorageService {
  private config: StorageConfig;
  private s3Client?: S3;

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.type === 's3' && config.s3) {
      this.s3Client = new S3({
        region: config.s3.region,
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
        endpoint: config.s3.endpoint,
      });
    }

    // Ensure local storage directory exists
    if (config.type === 'local' && config.basePath) {
      if (!existsSync(config.basePath)) {
        mkdirSync(config.basePath, { recursive: true });
      }
    }
  }

  /**
   * Upload a file
   */
  async uploadFile(
    file: FileUpload,
    collection: Collection,
    recordId: string,
    fieldName: string
  ): Promise<StoredFile> {
    // Validate file
    this.validateFile(file, collection, fieldName);

    // Generate unique filename
    const ext = extname(file.originalname);
    const filename = `${nanoid(15)}${ext}`;
    const path = this.getFilePath(collection.name, recordId, fieldName, filename);

    // Store file
    if (this.config.type === 's3') {
      await this.uploadToS3(path, file.buffer, file.mimetype);
    } else {
      await this.uploadToLocal(path, file.buffer);
    }

    // Generate thumbnails for images
    const field = collection.schema.find(f => f.name === fieldName);
    if (field?.options?.thumbs && this.isImage(file.mimetype)) {
      await this.generateThumbnails(path, file.buffer, field.options.thumbs);
    }

    const storedFile: StoredFile = {
      name: filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: this.getFileUrl(collection.name, recordId, fieldName, filename),
    };

    return storedFile;
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: FileUpload[],
    collection: Collection,
    recordId: string,
    fieldName: string
  ): Promise<StoredFile[]> {
    const storedFiles: StoredFile[] = [];

    for (const file of files) {
      const stored = await this.uploadFile(file, collection, recordId, fieldName);
      storedFiles.push(stored);
    }

    return storedFiles;
  }

  /**
   * Delete a file
   */
  async deleteFile(
    collection: Collection,
    recordId: string,
    fieldName: string,
    filename: string
  ): Promise<void> {
    const path = this.getFilePath(collection.name, recordId, fieldName, filename);

    if (this.config.type === 's3') {
      await this.deleteFromS3(path);
    } else {
      await this.deleteFromLocal(path);
    }

    // Delete thumbnails
    const field = collection.schema.find(f => f.name === fieldName);
    if (field?.options?.thumbs) {
      for (const thumb of field.options.thumbs) {
        const thumbPath = this.getThumbPath(collection.name, recordId, fieldName, filename, thumb);
        if (this.config.type === 's3') {
          await this.deleteFromS3(thumbPath);
        } else {
          await this.deleteFromLocal(thumbPath);
        }
      }
    }
  }

  /**
   * Get file content
   */
  async getFile(
    collection: Collection,
    recordId: string,
    fieldName: string,
    filename: string
  ): Promise<Buffer> {
    const path = this.getFilePath(collection.name, recordId, fieldName, filename);

    if (this.config.type === 's3') {
      return await this.getFromS3(path);
    } else {
      return await this.getFromLocal(path);
    }
  }

  /**
   * Get thumbnail
   */
  async getThumbnail(
    collection: Collection,
    recordId: string,
    fieldName: string,
    filename: string,
    size: string
  ): Promise<Buffer> {
    const thumbPath = this.getThumbPath(collection.name, recordId, fieldName, filename, size);

    if (this.config.type === 's3') {
      return await this.getFromS3(thumbPath);
    } else {
      return await this.getFromLocal(thumbPath);
    }
  }

  /**
   * Validate file against field schema
   */
  private validateFile(file: FileUpload, collection: Collection, fieldName: string): void {
    const field = collection.schema.find(f => f.name === fieldName);
    if (!field || field.type !== 'file') {
      throw new Error(`Field '${fieldName}' is not a file field`);
    }

    const options = field.options || {};

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds maximum of ${options.maxSize} bytes`);
    }

    // Check mime type
    if (options.mimeTypes && options.mimeTypes.length > 0) {
      const allowed = options.mimeTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.mimetype.startsWith(type.slice(0, -2));
        }
        return file.mimetype === type;
      });

      if (!allowed) {
        throw new Error(`File type '${file.mimetype}' is not allowed`);
      }
    }
  }

  /**
   * Check if mime type is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Get file path
   */
  private getFilePath(collection: string, recordId: string, fieldName: string, filename: string): string {
    return `${collection}/${recordId}/${fieldName}/${filename}`;
  }

  /**
   * Get thumbnail path
   */
  private getThumbPath(
    collection: string,
    recordId: string,
    fieldName: string,
    filename: string,
    size: string
  ): string {
    const ext = extname(filename);
    const name = filename.slice(0, -ext.length);
    return `${collection}/${recordId}/${fieldName}/thumbs_${size}/${name}_${size}${ext}`;
  }

  /**
   * Get file URL
   */
  private getFileUrl(collection: string, recordId: string, fieldName: string, filename: string): string {
    return `/api/files/${collection}/${recordId}/${fieldName}/${filename}`;
  }

  /**
   * Upload to local filesystem
   */
  private async uploadToLocal(path: string, buffer: Buffer): Promise<void> {
    const fullPath = join(this.config.basePath!, path);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(fullPath);
      stream.write(buffer);
      stream.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
  }

  /**
   * Delete from local filesystem
   */
  private async deleteFromLocal(path: string): Promise<void> {
    const fullPath = join(this.config.basePath!, path);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
    }
  }

  /**
   * Get from local filesystem
   */
  private async getFromLocal(path: string): Promise<Buffer> {
    const fullPath = join(this.config.basePath!, path);
    if (!existsSync(fullPath)) {
      throw new Error('File not found');
    }
    return readFileSync(fullPath);
  }

  /**
   * Upload to S3
   */
  private async uploadToS3(path: string, buffer: Buffer, mimeType: string): Promise<void> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 not configured');
    }

    await this.s3Client
      .putObject({
        Bucket: this.config.s3.bucket,
        Key: path,
        Body: buffer,
        ContentType: mimeType,
      })
      .promise();
  }

  /**
   * Delete from S3
   */
  private async deleteFromS3(path: string): Promise<void> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 not configured');
    }

    try {
      await this.s3Client
        .deleteObject({
          Bucket: this.config.s3.bucket,
          Key: path,
        })
        .promise();
    } catch (error) {
      // Ignore not found errors
    }
  }

  /**
   * Get from S3
   */
  private async getFromS3(path: string): Promise<Buffer> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 not configured');
    }

    try {
      const result = await this.s3Client
        .getObject({
          Bucket: this.config.s3.bucket,
          Key: path,
        })
        .promise();

      return result.Body as Buffer;
    } catch (error) {
      throw new Error('File not found');
    }
  }

  /**
   * Generate thumbnails for images
   */
  private async generateThumbnails(path: string, buffer: Buffer, sizes: string[]): Promise<void> {
    for (const size of sizes) {
      const [width, height] = size.split('x').map(Number);

      const thumbBuffer = await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      const ext = extname(path);
      const basePath = path.slice(0, -ext.length);
      const thumbPath = `${basePath}_thumb_${size}${ext}`;

      if (this.config.type === 's3') {
        await this.uploadToS3(thumbPath, thumbBuffer, 'image/jpeg');
      } else {
        await this.uploadToLocal(thumbPath, thumbBuffer);
      }
    }
  }
}
