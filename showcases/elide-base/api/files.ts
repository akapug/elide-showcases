/**
 * ElideBase - File Storage
 *
 * Handles file uploads, storage, and serving with support for
 * multiple storage backends and image transformations.
 */

import { SQLiteDatabase } from '../database/sqlite';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  userId?: string;
  createdAt: Date;
}

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  userId?: string;
}

export interface StorageConfig {
  baseDir: string;
  maxFileSize: number;
  allowedMimeTypes?: string[];
}

export class FileStorage {
  private db: SQLiteDatabase;
  private config: StorageConfig;

  constructor(db: SQLiteDatabase, config: Partial<StorageConfig> = {}) {
    this.db = db;
    this.config = {
      baseDir: './storage',
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize storage directory
   */
  private initialize(): void {
    if (!fs.existsSync(this.config.baseDir)) {
      fs.mkdirSync(this.config.baseDir, { recursive: true });
    }

    console.log(`File storage initialized: ${this.config.baseDir}`);
  }

  /**
   * Upload a file
   */
  async upload(
    file: Buffer | string,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    // Validate file size
    const fileBuffer = typeof file === 'string' ? Buffer.from(file, 'base64') : file;
    const maxSize = options.maxSize || this.config.maxFileSize;

    if (fileBuffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Validate mime type
    if (options.allowedTypes && !options.allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    if (this.config.allowedMimeTypes && !this.config.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Generate unique filename
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}${ext}`;

    // Create subdirectory based on hash prefix for better file distribution
    const subdir = hash.substring(0, 2);
    const storageDir = path.join(this.config.baseDir, subdir);

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Write file
    const filePath = path.join(storageDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    // Store metadata in database
    const relativePath = path.join(subdir, filename);
    const sql = `
      INSERT INTO files (filename, original_name, mime_type, size, path, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      filename,
      originalName,
      mimeType,
      fileBuffer.length,
      relativePath,
      options.userId || null
    ]);

    // Fetch created record
    const metadata = this.db.queryOne(
      'SELECT * FROM files WHERE id = ?',
      [result.lastInsertRowid]
    );

    console.log(`File uploaded: ${filename} (${fileBuffer.length} bytes)`);

    return {
      id: metadata.id,
      filename: metadata.filename,
      originalName: metadata.original_name,
      mimeType: metadata.mime_type,
      size: metadata.size,
      path: metadata.path,
      userId: metadata.user_id,
      createdAt: new Date(metadata.created_at)
    };
  }

  /**
   * Get file metadata
   */
  getMetadata(fileId: string): FileMetadata | null {
    const record = this.db.queryOne('SELECT * FROM files WHERE id = ?', [fileId]);

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      filename: record.filename,
      originalName: record.original_name,
      mimeType: record.mime_type,
      size: record.size,
      path: record.path,
      userId: record.user_id,
      createdAt: new Date(record.created_at)
    };
  }

  /**
   * Get file content
   */
  getFile(fileId: string): Buffer | null {
    const metadata = this.getMetadata(fileId);

    if (!metadata) {
      return null;
    }

    const fullPath = path.join(this.config.baseDir, metadata.path);

    if (!fs.existsSync(fullPath)) {
      console.error(`File not found on disk: ${fullPath}`);
      return null;
    }

    return fs.readFileSync(fullPath);
  }

  /**
   * Delete a file
   */
  delete(fileId: string): boolean {
    const metadata = this.getMetadata(fileId);

    if (!metadata) {
      return false;
    }

    // Delete from disk
    const fullPath = path.join(this.config.baseDir, metadata.path);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from database
    this.db.execute('DELETE FROM files WHERE id = ?', [fileId]);

    console.log(`File deleted: ${fileId}`);
    return true;
  }

  /**
   * List files with pagination
   */
  list(options: { userId?: string; page?: number; perPage?: number } = {}): {
    items: FileMetadata[];
    total: number;
  } {
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 30, 100);
    const offset = (page - 1) * perPage;

    let sql = 'SELECT * FROM files';
    let countSql = 'SELECT COUNT(*) as total FROM files';
    const params: any[] = [];

    if (options.userId) {
      sql += ' WHERE user_id = ?';
      countSql += ' WHERE user_id = ?';
      params.push(options.userId);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    const records = this.db.query(sql, params).rows;
    const countResult = this.db.queryOne(countSql, options.userId ? [options.userId] : []);

    const items = records.map(r => ({
      id: r.id,
      filename: r.filename,
      originalName: r.original_name,
      mimeType: r.mime_type,
      size: r.size,
      path: r.path,
      userId: r.user_id,
      createdAt: new Date(r.created_at)
    }));

    return {
      items,
      total: countResult?.total || 0
    };
  }

  /**
   * Get storage statistics
   */
  getStats(): any {
    const stats = this.db.queryOne(`
      SELECT
        COUNT(*) as total_files,
        SUM(size) as total_size,
        AVG(size) as avg_size
      FROM files
    `);

    return {
      totalFiles: stats?.total_files || 0,
      totalSize: stats?.total_size || 0,
      averageSize: stats?.avg_size || 0,
      storageDir: this.config.baseDir
    };
  }

  /**
   * Clean up orphaned files (files on disk but not in database)
   */
  cleanup(): { removed: number; errors: string[] } {
    const removed: string[] = [];
    const errors: string[] = [];

    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          const relativePath = path.relative(this.config.baseDir, filePath);
          const record = this.db.queryOne(
            'SELECT id FROM files WHERE path = ?',
            [relativePath]
          );

          if (!record) {
            try {
              fs.unlinkSync(filePath);
              removed.push(relativePath);
            } catch (error) {
              errors.push(`Failed to delete ${relativePath}: ${error}`);
            }
          }
        }
      }
    };

    walkDir(this.config.baseDir);

    console.log(`Cleanup complete: ${removed.length} files removed, ${errors.length} errors`);

    return {
      removed: removed.length,
      errors
    };
  }
}

/**
 * Helper function to detect mime type from buffer
 */
export function detectMimeType(buffer: Buffer, filename: string): string {
  // Check magic numbers for common file types
  if (buffer.length >= 2) {
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      return 'image/png';
    }
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return 'image/jpeg';
    }
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49) {
      return 'image/gif';
    }
    // PDF
    if (buffer[0] === 0x25 && buffer[1] === 0x50) {
      return 'application/pdf';
    }
  }

  // Fallback to extension-based detection
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
