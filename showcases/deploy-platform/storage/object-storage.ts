/**
 * Deploy Platform - Object Storage
 *
 * Manages storage for builds, assets, and deployments.
 * Supports multiple backends (S3, GCS, local filesystem).
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface StorageConfig {
  backend: 'local' | 's3' | 'gcs' | 'azure';
  basePath?: string;
  bucket?: string;
  region?: string;
  credentials?: any;
}

interface StorageObject {
  key: string;
  size: number;
  contentType: string;
  etag: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  acl?: 'private' | 'public-read';
}

interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  delimiter?: string;
}

/**
 * Object Storage
 */
export class ObjectStorage {
  private config: StorageConfig;
  private basePath: string;

  constructor(config: StorageConfig) {
    this.config = config;
    this.basePath = config.basePath || '/tmp/deploy-platform/storage';

    if (config.backend === 'local') {
      this.ensureDirectory(this.basePath);
    }
  }

  /**
   * Upload object
   */
  async upload(key: string, content: Buffer | string, options: UploadOptions = {}): Promise<StorageObject> {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;

    switch (this.config.backend) {
      case 'local':
        return this.uploadLocal(key, buffer, options);

      case 's3':
        return this.uploadS3(key, buffer, options);

      case 'gcs':
        return this.uploadGCS(key, buffer, options);

      default:
        throw new Error(`Unsupported backend: ${this.config.backend}`);
    }
  }

  /**
   * Download object
   */
  async download(key: string): Promise<Buffer> {
    switch (this.config.backend) {
      case 'local':
        return this.downloadLocal(key);

      case 's3':
        return this.downloadS3(key);

      case 'gcs':
        return this.downloadGCS(key);

      default:
        throw new Error(`Unsupported backend: ${this.config.backend}`);
    }
  }

  /**
   * Delete object
   */
  async delete(key: string): Promise<void> {
    switch (this.config.backend) {
      case 'local':
        return this.deleteLocal(key);

      case 's3':
        return this.deleteS3(key);

      case 'gcs':
        return this.deleteGCS(key);

      default:
        throw new Error(`Unsupported backend: ${this.config.backend}`);
    }
  }

  /**
   * List objects
   */
  async list(options: ListOptions = {}): Promise<StorageObject[]> {
    switch (this.config.backend) {
      case 'local':
        return this.listLocal(options);

      case 's3':
        return this.listS3(options);

      case 'gcs':
        return this.listGCS(options);

      default:
        throw new Error(`Unsupported backend: ${this.config.backend}`);
    }
  }

  /**
   * Check if object exists
   */
  async exists(key: string): Promise<boolean> {
    switch (this.config.backend) {
      case 'local':
        return this.existsLocal(key);

      case 's3':
        return this.existsS3(key);

      case 'gcs':
        return this.existsGCS(key);

      default:
        return false;
    }
  }

  /**
   * Get object metadata
   */
  async getMetadata(key: string): Promise<StorageObject> {
    switch (this.config.backend) {
      case 'local':
        return this.getMetadataLocal(key);

      case 's3':
        return this.getMetadataS3(key);

      case 'gcs':
        return this.getMetadataGCS(key);

      default:
        throw new Error(`Unsupported backend: ${this.config.backend}`);
    }
  }

  /**
   * Copy object
   */
  async copy(sourceKey: string, destKey: string): Promise<void> {
    const content = await this.download(sourceKey);
    await this.upload(destKey, content);
  }

  /**
   * Get signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Mock implementation
    const signature = createHash('sha256')
      .update(`${key}:${expiresIn}:${Date.now()}`)
      .digest('hex');

    return `https://storage.example.com/${key}?signature=${signature}&expires=${expiresIn}`;
  }

  // Local filesystem implementation

  private async uploadLocal(key: string, buffer: Buffer, options: UploadOptions): Promise<StorageObject> {
    const filePath = path.join(this.basePath, key);
    const dir = path.dirname(filePath);

    this.ensureDirectory(dir);
    fs.writeFileSync(filePath, buffer);

    // Save metadata
    if (options.metadata) {
      const metadataPath = `${filePath}.meta.json`;
      fs.writeFileSync(metadataPath, JSON.stringify(options.metadata));
    }

    return {
      key,
      size: buffer.length,
      contentType: options.contentType || 'application/octet-stream',
      etag: this.calculateETag(buffer),
      lastModified: new Date(),
      metadata: options.metadata
    };
  }

  private async downloadLocal(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Object not found: ${key}`);
    }

    return fs.readFileSync(filePath);
  }

  private async deleteLocal(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const metadataPath = `${filePath}.meta.json`;
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
  }

  private async listLocal(options: ListOptions): Promise<StorageObject[]> {
    const prefix = options.prefix || '';
    const searchPath = path.join(this.basePath, prefix);
    const objects: StorageObject[] = [];

    if (!fs.existsSync(searchPath)) {
      return objects;
    }

    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        if (file.endsWith('.meta.json')) continue;

        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walk(filePath);
        } else {
          const key = path.relative(this.basePath, filePath);
          objects.push({
            key,
            size: stat.size,
            contentType: 'application/octet-stream',
            etag: '',
            lastModified: stat.mtime
          });
        }
      }
    };

    walk(searchPath);

    return options.maxKeys ? objects.slice(0, options.maxKeys) : objects;
  }

  private async existsLocal(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key);
    return fs.existsSync(filePath);
  }

  private async getMetadataLocal(key: string): Promise<StorageObject> {
    const filePath = path.join(this.basePath, key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Object not found: ${key}`);
    }

    const stat = fs.statSync(filePath);
    let metadata: Record<string, string> | undefined;

    const metadataPath = `${filePath}.meta.json`;
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }

    return {
      key,
      size: stat.size,
      contentType: 'application/octet-stream',
      etag: '',
      lastModified: stat.mtime,
      metadata
    };
  }

  // S3 implementation (mock)

  private async uploadS3(key: string, buffer: Buffer, options: UploadOptions): Promise<StorageObject> {
    console.log(`[S3] Uploading ${key} (${buffer.length} bytes)`);

    return {
      key,
      size: buffer.length,
      contentType: options.contentType || 'application/octet-stream',
      etag: this.calculateETag(buffer),
      lastModified: new Date(),
      metadata: options.metadata
    };
  }

  private async downloadS3(key: string): Promise<Buffer> {
    console.log(`[S3] Downloading ${key}`);
    return Buffer.from('Mock S3 content');
  }

  private async deleteS3(key: string): Promise<void> {
    console.log(`[S3] Deleting ${key}`);
  }

  private async listS3(options: ListOptions): Promise<StorageObject[]> {
    console.log(`[S3] Listing objects with prefix: ${options.prefix}`);
    return [];
  }

  private async existsS3(key: string): Promise<boolean> {
    console.log(`[S3] Checking existence: ${key}`);
    return false;
  }

  private async getMetadataS3(key: string): Promise<StorageObject> {
    console.log(`[S3] Getting metadata: ${key}`);
    throw new Error('Not implemented');
  }

  // GCS implementation (mock)

  private async uploadGCS(key: string, buffer: Buffer, options: UploadOptions): Promise<StorageObject> {
    console.log(`[GCS] Uploading ${key} (${buffer.length} bytes)`);

    return {
      key,
      size: buffer.length,
      contentType: options.contentType || 'application/octet-stream',
      etag: this.calculateETag(buffer),
      lastModified: new Date(),
      metadata: options.metadata
    };
  }

  private async downloadGCS(key: string): Promise<Buffer> {
    console.log(`[GCS] Downloading ${key}`);
    return Buffer.from('Mock GCS content');
  }

  private async deleteGCS(key: string): Promise<void> {
    console.log(`[GCS] Deleting ${key}`);
  }

  private async listGCS(options: ListOptions): Promise<StorageObject[]> {
    console.log(`[GCS] Listing objects with prefix: ${options.prefix}`);
    return [];
  }

  private async existsGCS(key: string): Promise<boolean> {
    console.log(`[GCS] Checking existence: ${key}`);
    return false;
  }

  private async getMetadataGCS(key: string): Promise<StorageObject> {
    console.log(`[GCS] Getting metadata: ${key}`);
    throw new Error('Not implemented');
  }

  // Utility methods

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private calculateETag(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }
}

/**
 * Deployment Storage
 */
export class DeploymentStorage {
  private storage: ObjectStorage;

  constructor(config: StorageConfig) {
    this.storage = new ObjectStorage(config);
  }

  /**
   * Save deployment
   */
  async saveDeployment(deploymentId: string, files: Map<string, Buffer>): Promise<void> {
    console.log(`Saving deployment ${deploymentId} (${files.size} files)`);

    for (const [filePath, content] of files.entries()) {
      const key = `deployments/${deploymentId}/${filePath}`;
      await this.storage.upload(key, content, {
        contentType: this.detectContentType(filePath),
        metadata: {
          deploymentId,
          originalPath: filePath
        }
      });
    }

    console.log(`Deployment ${deploymentId} saved`);
  }

  /**
   * Get deployment file
   */
  async getDeploymentFile(deploymentId: string, filePath: string): Promise<Buffer> {
    const key = `deployments/${deploymentId}/${filePath}`;
    return this.storage.download(key);
  }

  /**
   * List deployment files
   */
  async listDeploymentFiles(deploymentId: string): Promise<string[]> {
    const objects = await this.storage.list({
      prefix: `deployments/${deploymentId}/`
    });

    return objects.map(obj => obj.key.replace(`deployments/${deploymentId}/`, ''));
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId: string): Promise<void> {
    const files = await this.listDeploymentFiles(deploymentId);

    for (const file of files) {
      const key = `deployments/${deploymentId}/${file}`;
      await this.storage.delete(key);
    }

    console.log(`Deleted deployment ${deploymentId}`);
  }

  /**
   * Copy deployment
   */
  async copyDeployment(sourceId: string, destId: string): Promise<void> {
    const files = await this.listDeploymentFiles(sourceId);

    for (const file of files) {
      const sourceKey = `deployments/${sourceId}/${file}`;
      const destKey = `deployments/${destId}/${file}`;
      await this.storage.copy(sourceKey, destKey);
    }

    console.log(`Copied deployment ${sourceId} to ${destId}`);
  }

  /**
   * Detect content type
   */
  private detectContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf'
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Build Artifact Storage
 */
export class BuildArtifactStorage {
  private storage: ObjectStorage;

  constructor(config: StorageConfig) {
    this.storage = new ObjectStorage(config);
  }

  /**
   * Save build artifacts
   */
  async saveArtifacts(buildId: string, artifactsPath: string): Promise<void> {
    console.log(`Saving build artifacts for ${buildId}`);

    // Mock implementation - would walk directory and upload files
    const key = `builds/${buildId}/artifacts.tar.gz`;
    await this.storage.upload(key, Buffer.from('Mock artifacts'), {
      contentType: 'application/gzip',
      metadata: { buildId }
    });

    console.log(`Build artifacts saved for ${buildId}`);
  }

  /**
   * Get build artifacts
   */
  async getArtifacts(buildId: string): Promise<Buffer> {
    const key = `builds/${buildId}/artifacts.tar.gz`;
    return this.storage.download(key);
  }

  /**
   * Delete build artifacts
   */
  async deleteArtifacts(buildId: string): Promise<void> {
    const key = `builds/${buildId}/artifacts.tar.gz`;
    await this.storage.delete(key);

    console.log(`Deleted build artifacts for ${buildId}`);
  }
}

// Export storage instances
export const objectStorage = new ObjectStorage({
  backend: 'local',
  basePath: process.env.STORAGE_PATH || '/tmp/deploy-platform/storage'
});

export const deploymentStorage = new DeploymentStorage({
  backend: 'local',
  basePath: process.env.STORAGE_PATH || '/tmp/deploy-platform/storage'
});

export const buildArtifactStorage = new BuildArtifactStorage({
  backend: 'local',
  basePath: process.env.STORAGE_PATH || '/tmp/deploy-platform/storage'
});
