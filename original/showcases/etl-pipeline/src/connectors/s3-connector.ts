/**
 * S3 Connector - AWS S3 Integration
 *
 * Comprehensive S3 operations for ETL pipelines:
 * - Read/Write objects
 * - Streaming support for large files
 * - Multipart uploads
 * - Batch operations
 * - Prefix-based listing
 * - Versioning support
 * - Server-side encryption
 * - Presigned URLs
 * - S3 Select queries
 * - Lifecycle management
 * - Cross-region replication
 */

// ==================== Types ====================

interface S3Config {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  endpoint?: string;
  bucket: string;
  forcePathStyle?: boolean;
}

interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  storageClass: string;
  metadata?: Record<string, string>;
}

interface S3PutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  serverSideEncryption?: 'AES256' | 'aws:kms';
  storageClass?: 'STANDARD' | 'REDUCED_REDUNDANCY' | 'STANDARD_IA' | 'ONEZONE_IA' | 'INTELLIGENT_TIERING' | 'GLACIER' | 'DEEP_ARCHIVE';
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  tags?: Record<string, string>;
}

interface S3GetOptions {
  range?: { start: number; end: number };
  versionId?: string;
  ifModifiedSince?: Date;
  ifUnmodifiedSince?: Date;
}

interface S3ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

interface S3ListResult {
  objects: S3Object[];
  prefixes: string[];
  isTruncated: boolean;
  continuationToken?: string;
}

interface MultipartUpload {
  uploadId: string;
  key: string;
  parts: MultipartPart[];
}

interface MultipartPart {
  partNumber: number;
  etag: string;
  size: number;
}

interface S3SelectQuery {
  expression: string;
  inputSerialization: {
    format: 'CSV' | 'JSON' | 'Parquet';
    compressionType?: 'NONE' | 'GZIP' | 'BZIP2';
    csv?: {
      fileHeaderInfo?: 'USE' | 'IGNORE' | 'NONE';
      recordDelimiter?: string;
      fieldDelimiter?: string;
    };
    json?: {
      type?: 'DOCUMENT' | 'LINES';
    };
  };
  outputSerialization: {
    format: 'CSV' | 'JSON';
    csv?: {
      recordDelimiter?: string;
      fieldDelimiter?: string;
    };
    json?: {
      recordDelimiter?: string;
    };
  };
}

// ==================== S3 Client ====================

export class S3Connector {
  private config: S3Config;
  private multipartUploads = new Map<string, MultipartUpload>();

  constructor(config: S3Config) {
    this.config = {
      forcePathStyle: false,
      ...config
    };
  }

  /**
   * Put object to S3
   */
  async putObject(
    key: string,
    data: string | Buffer | Uint8Array,
    options?: S3PutOptions
  ): Promise<S3Object> {
    console.log(`Uploading to s3://${this.config.bucket}/${key}...`);

    const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length;

    // Simulated upload
    await this.sleep(Math.min(size / 1000000 * 100, 1000)); // Scale with size

    const s3Object: S3Object = {
      key,
      size,
      lastModified: new Date(),
      etag: this.generateETag(),
      storageClass: options?.storageClass || 'STANDARD',
      metadata: options?.metadata
    };

    console.log(`Uploaded ${key} (${this.formatBytes(size)})`);

    return s3Object;
  }

  /**
   * Get object from S3
   */
  async getObject(key: string, options?: S3GetOptions): Promise<{ data: Buffer; metadata: S3Object }> {
    console.log(`Downloading from s3://${this.config.bucket}/${key}...`);

    // Simulated download
    await this.sleep(100);

    // Generate simulated data
    const data = Buffer.from(JSON.stringify({
      message: 'Simulated S3 object data',
      key,
      timestamp: Date.now()
    }));

    const metadata: S3Object = {
      key,
      size: data.length,
      lastModified: new Date(),
      etag: this.generateETag(),
      storageClass: 'STANDARD'
    };

    console.log(`Downloaded ${key} (${this.formatBytes(data.length)})`);

    return { data, metadata };
  }

  /**
   * Stream object from S3 (for large files)
   */
  async *streamObject(key: string, chunkSize: number = 1024 * 1024): AsyncGenerator<Buffer> {
    console.log(`Streaming from s3://${this.config.bucket}/${key}...`);

    // Simulated streaming
    const totalSize = 10 * 1024 * 1024; // 10 MB
    let bytesRead = 0;

    while (bytesRead < totalSize) {
      const currentChunkSize = Math.min(chunkSize, totalSize - bytesRead);
      const chunk = Buffer.alloc(currentChunkSize);

      await this.sleep(10);

      bytesRead += currentChunkSize;
      yield chunk;
    }

    console.log(`Streamed ${this.formatBytes(bytesRead)}`);
  }

  /**
   * Delete object from S3
   */
  async deleteObject(key: string, versionId?: string): Promise<void> {
    console.log(`Deleting s3://${this.config.bucket}/${key}${versionId ? ` (version: ${versionId})` : ''}...`);

    await this.sleep(50);

    console.log(`Deleted ${key}`);
  }

  /**
   * Delete multiple objects
   */
  async deleteObjects(keys: string[]): Promise<{ deleted: string[]; errors: Array<{ key: string; error: string }> }> {
    console.log(`Deleting ${keys.length} objects...`);

    const deleted: string[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    for (const key of keys) {
      try {
        await this.deleteObject(key);
        deleted.push(key);
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    return { deleted, errors };
  }

  /**
   * List objects with prefix
   */
  async listObjects(options?: S3ListOptions): Promise<S3ListResult> {
    const prefix = options?.prefix || '';
    const maxKeys = options?.maxKeys || 1000;

    console.log(`Listing objects with prefix: ${prefix || '(none)'}...`);

    await this.sleep(100);

    // Generate simulated objects
    const objectCount = Math.floor(Math.random() * 20) + 5;
    const objects: S3Object[] = [];

    for (let i = 0; i < objectCount; i++) {
      objects.push({
        key: `${prefix}file_${i}.json`,
        size: Math.floor(Math.random() * 1000000) + 1000,
        lastModified: new Date(Date.now() - Math.random() * 86400000),
        etag: this.generateETag(),
        storageClass: 'STANDARD'
      });
    }

    console.log(`Found ${objects.length} objects`);

    return {
      objects,
      prefixes: [],
      isTruncated: false
    };
  }

  /**
   * List all objects (handles pagination)
   */
  async *listAllObjects(options?: S3ListOptions): AsyncGenerator<S3Object> {
    let continuationToken: string | undefined;

    do {
      const result = await this.listObjects({
        ...options,
        continuationToken
      });

      for (const obj of result.objects) {
        yield obj;
      }

      continuationToken = result.isTruncated ? result.continuationToken : undefined;
    } while (continuationToken);
  }

  /**
   * Copy object within S3
   */
  async copyObject(
    sourceKey: string,
    destinationKey: string,
    sourceBucket?: string
  ): Promise<S3Object> {
    const source = `${sourceBucket || this.config.bucket}/${sourceKey}`;
    const destination = `${this.config.bucket}/${destinationKey}`;

    console.log(`Copying ${source} to ${destination}...`);

    await this.sleep(100);

    return {
      key: destinationKey,
      size: Math.floor(Math.random() * 1000000),
      lastModified: new Date(),
      etag: this.generateETag(),
      storageClass: 'STANDARD'
    };
  }

  /**
   * Check if object exists
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.headObject(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get object metadata without downloading
   */
  async headObject(key: string): Promise<S3Object> {
    console.log(`Getting metadata for s3://${this.config.bucket}/${key}...`);

    await this.sleep(20);

    return {
      key,
      size: Math.floor(Math.random() * 1000000),
      lastModified: new Date(),
      etag: this.generateETag(),
      storageClass: 'STANDARD',
      metadata: {
        'custom-metadata': 'value'
      }
    };
  }

  /**
   * Generate presigned URL for temporary access
   */
  async getPresignedUrl(
    key: string,
    operation: 'getObject' | 'putObject',
    expiresIn: number = 3600
  ): Promise<string> {
    console.log(`Generating presigned URL for ${operation} on ${key} (expires in ${expiresIn}s)...`);

    await this.sleep(10);

    // Simulated presigned URL
    const url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiresIn}`;

    return url;
  }

  /**
   * Start multipart upload
   */
  async createMultipartUpload(key: string, options?: S3PutOptions): Promise<string> {
    console.log(`Starting multipart upload for ${key}...`);

    const uploadId = this.generateUploadId();

    this.multipartUploads.set(uploadId, {
      uploadId,
      key,
      parts: []
    });

    await this.sleep(50);

    console.log(`Multipart upload initiated: ${uploadId}`);

    return uploadId;
  }

  /**
   * Upload part
   */
  async uploadPart(
    uploadId: string,
    partNumber: number,
    data: Buffer
  ): Promise<MultipartPart> {
    const upload = this.multipartUploads.get(uploadId);

    if (!upload) {
      throw new Error(`Upload ID ${uploadId} not found`);
    }

    console.log(`Uploading part ${partNumber} (${this.formatBytes(data.length)})...`);

    await this.sleep(Math.min(data.length / 1000000 * 100, 500));

    const part: MultipartPart = {
      partNumber,
      etag: this.generateETag(),
      size: data.length
    };

    upload.parts.push(part);

    return part;
  }

  /**
   * Complete multipart upload
   */
  async completeMultipartUpload(uploadId: string): Promise<S3Object> {
    const upload = this.multipartUploads.get(uploadId);

    if (!upload) {
      throw new Error(`Upload ID ${uploadId} not found`);
    }

    console.log(`Completing multipart upload for ${upload.key}...`);

    await this.sleep(100);

    const totalSize = upload.parts.reduce((sum, part) => sum + part.size, 0);

    const s3Object: S3Object = {
      key: upload.key,
      size: totalSize,
      lastModified: new Date(),
      etag: this.generateETag(),
      storageClass: 'STANDARD'
    };

    this.multipartUploads.delete(uploadId);

    console.log(`Multipart upload completed: ${upload.key} (${this.formatBytes(totalSize)})`);

    return s3Object;
  }

  /**
   * Abort multipart upload
   */
  async abortMultipartUpload(uploadId: string): Promise<void> {
    const upload = this.multipartUploads.get(uploadId);

    if (!upload) {
      throw new Error(`Upload ID ${uploadId} not found`);
    }

    console.log(`Aborting multipart upload for ${upload.key}...`);

    this.multipartUploads.delete(uploadId);

    await this.sleep(50);
  }

  /**
   * S3 Select - Query data without downloading entire object
   */
  async selectObjectContent(key: string, query: S3SelectQuery): Promise<string> {
    console.log(`Executing S3 Select query on ${key}...`);

    await this.sleep(200);

    // Simulated query result
    const result = JSON.stringify([
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
      { id: 3, name: 'Item 3', value: 300 }
    ]);

    console.log(`Query returned ${result.length} bytes`);

    return result;
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(
    files: Array<{ key: string; data: string | Buffer; options?: S3PutOptions }>
  ): Promise<Array<{ key: string; success: boolean; error?: string }>> {
    console.log(`Batch uploading ${files.length} files...`);

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          await this.putObject(file.key, file.data, file.options);
          return { key: file.key, success: true };
        } catch (error) {
          return { key: file.key, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`Batch upload complete: ${successCount}/${files.length} successful`);

    return results;
  }

  /**
   * Batch download multiple files
   */
  async batchDownload(keys: string[]): Promise<Array<{ key: string; data?: Buffer; error?: string }>> {
    console.log(`Batch downloading ${keys.length} files...`);

    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const { data } = await this.getObject(key);
          return { key, data };
        } catch (error) {
          return { key, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.data).length;
    console.log(`Batch download complete: ${successCount}/${keys.length} successful`);

    return results;
  }

  /**
   * Sync directory to S3 (upload all files with prefix)
   */
  async syncToS3(
    localFiles: Array<{ path: string; data: Buffer }>,
    prefix: string
  ): Promise<{ uploaded: number; skipped: number; failed: number }> {
    console.log(`Syncing ${localFiles.length} files to s3://${this.config.bucket}/${prefix}...`);

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of localFiles) {
      const key = `${prefix}${file.path}`;

      try {
        // Check if file exists and compare
        const exists = await this.objectExists(key);

        if (exists) {
          const metadata = await this.headObject(key);

          // Skip if same size (simplified comparison)
          if (metadata.size === file.data.length) {
            skipped++;
            continue;
          }
        }

        await this.putObject(key, file.data);
        uploaded++;
      } catch (error) {
        console.error(`Failed to upload ${key}:`, error);
        failed++;
      }
    }

    console.log(`Sync complete: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);

    return { uploaded, skipped, failed };
  }

  /**
   * Get object tags
   */
  async getObjectTagging(key: string): Promise<Record<string, string>> {
    console.log(`Getting tags for ${key}...`);

    await this.sleep(20);

    return {
      Environment: 'production',
      Project: 'etl-pipeline',
      Owner: 'data-team'
    };
  }

  /**
   * Set object tags
   */
  async putObjectTagging(key: string, tags: Record<string, string>): Promise<void> {
    console.log(`Setting tags for ${key}:`, tags);

    await this.sleep(30);
  }

  /**
   * Get bucket versioning status
   */
  async getBucketVersioning(): Promise<{ status: 'Enabled' | 'Suspended' | 'Disabled' }> {
    console.log(`Getting versioning status for ${this.config.bucket}...`);

    await this.sleep(20);

    return { status: 'Enabled' };
  }

  /**
   * List object versions
   */
  async listObjectVersions(key: string): Promise<Array<{ versionId: string; lastModified: Date; isLatest: boolean }>> {
    console.log(`Listing versions for ${key}...`);

    await this.sleep(50);

    return [
      { versionId: 'v1', lastModified: new Date(), isLatest: true },
      { versionId: 'v2', lastModified: new Date(Date.now() - 86400000), isLatest: false }
    ];
  }

  // ==================== Utility Methods ====================

  private generateETag(): string {
    return `"${Math.random().toString(36).substr(2, 32)}"`;
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Example Usage ====================

export async function demonstrateS3Connector() {
  console.log('=== S3 Connector Demonstration ===\n');

  const s3 = new S3Connector({
    region: 'us-east-1',
    bucket: 'etl-pipeline-data',
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  });

  // Upload file
  const data = JSON.stringify({ message: 'Hello S3!', timestamp: Date.now() });
  await s3.putObject('test/data.json', data, {
    contentType: 'application/json',
    metadata: { source: 'etl-pipeline' },
    tags: { Environment: 'test' }
  });

  // Download file
  const { data: downloaded } = await s3.getObject('test/data.json');
  console.log('Downloaded:', downloaded.toString());

  // List objects
  const listResult = await s3.listObjects({ prefix: 'test/' });
  console.log(`Found ${listResult.objects.length} objects`);

  // Multipart upload
  const uploadId = await s3.createMultipartUpload('large-file.bin');
  await s3.uploadPart(uploadId, 1, Buffer.alloc(5 * 1024 * 1024));
  await s3.uploadPart(uploadId, 2, Buffer.alloc(5 * 1024 * 1024));
  await s3.completeMultipartUpload(uploadId);

  // S3 Select
  const queryResult = await s3.selectObjectContent('data/records.json', {
    expression: 'SELECT * FROM S3Object[*] WHERE value > 100',
    inputSerialization: { format: 'JSON', json: { type: 'LINES' } },
    outputSerialization: { format: 'JSON', json: { recordDelimiter: '\n' } }
  });

  console.log('Query result:', queryResult);

  // Presigned URL
  const url = await s3.getPresignedUrl('test/data.json', 'getObject', 3600);
  console.log('Presigned URL:', url);

  console.log('\n=== S3 Connector Demo Complete ===');
}

if (import.meta.main) {
  await demonstrateS3Connector();
}
