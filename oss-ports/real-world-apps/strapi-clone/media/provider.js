/**
 * Media Provider
 * Handles file upload and storage
 */

import { createHash } from 'crypto';
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { getDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

export class MediaProvider {
  constructor(config) {
    this.config = config;
    this.provider = config.provider || 'local';
    this.directory = config.providerOptions?.directory || './public/uploads';
    this.sizeLimit = config.sizeLimit || 10485760; // 10MB
    this.logger = logger.child('Media');

    // Ensure upload directory exists
    if (this.provider === 'local') {
      mkdirSync(this.directory, { recursive: true });
    }
  }

  /**
   * Upload file
   */
  async upload(file) {
    try {
      // Validate file
      this.validateFile(file);

      // Generate hash
      const hash = this.generateHash(file.buffer);

      // Get file extension
      const ext = extname(file.name);

      // Generate filename
      const filename = `${hash}${ext}`;

      // Upload based on provider
      let url;
      if (this.provider === 'local') {
        url = await this.uploadLocal(file, filename);
      } else if (this.provider === 's3') {
        url = await this.uploadS3(file, filename);
      } else {
        throw new Error(`Unsupported provider: ${this.provider}`);
      }

      // Save to database
      const mediaId = await this.saveToDatabase({
        name: file.name,
        hash,
        ext,
        mime: file.mime,
        size: file.size / 1024, // Convert to KB
        url,
        width: file.width,
        height: file.height,
      });

      this.logger.info(`File uploaded: ${file.name}`);

      return {
        id: mediaId,
        name: file.name,
        url,
        mime: file.mime,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload to local filesystem
   */
  async uploadLocal(file, filename) {
    const filepath = join(this.directory, filename);
    writeFileSync(filepath, file.buffer);

    return `/uploads/${filename}`;
  }

  /**
   * Upload to S3
   */
  async uploadS3(file, filename) {
    // In production, use AWS SDK
    // For now, simulate S3 upload
    this.logger.info(`[Simulated] Uploading to S3: ${filename}`);

    return `https://s3.amazonaws.com/bucket/${filename}`;
  }

  /**
   * Delete file
   */
  async delete(id) {
    try {
      const db = getDatabase();

      // Get media info
      const media = await db.query('SELECT * FROM cms_media WHERE id = ?', [id]);

      if (media.length === 0) {
        throw new Error('Media not found');
      }

      const file = media[0];

      // Delete from storage
      if (this.provider === 'local') {
        const filename = file.url.replace('/uploads/', '');
        const filepath = join(this.directory, filename);

        if (existsSync(filepath)) {
          unlinkSync(filepath);
        }
      }

      // Delete from database
      await db.execute('DELETE FROM cms_media WHERE id = ?', [id]);

      this.logger.info(`File deleted: ${file.name}`);

      return true;
    } catch (error) {
      this.logger.error('Delete failed:', error);
      throw error;
    }
  }

  /**
   * Get file
   */
  async get(id) {
    const db = getDatabase();
    const media = await db.query('SELECT * FROM cms_media WHERE id = ?', [id]);

    if (media.length === 0) {
      return null;
    }

    return this.deserialize(media[0]);
  }

  /**
   * List files
   */
  async list(filters = {}) {
    const db = getDatabase();
    let sql = 'SELECT * FROM cms_media';
    const params = [];

    if (filters.mime) {
      sql += ' WHERE mime LIKE ?';
      params.push(`${filters.mime}%`);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const media = await db.query(sql, params);

    return media.map(m => this.deserialize(m));
  }

  /**
   * Validate file
   */
  validateFile(file) {
    // Check size
    if (file.size > this.sizeLimit) {
      throw new Error(`File size exceeds limit (${this.sizeLimit} bytes)`);
    }

    // Check allowed formats
    const allowedFormats = this.config.allowedFormats || ['image', 'video', 'audio', 'file'];
    const fileType = this.getFileType(file.mime);

    if (!allowedFormats.includes(fileType)) {
      throw new Error(`File type not allowed: ${fileType}`);
    }

    return true;
  }

  /**
   * Generate file hash
   */
  generateHash(buffer) {
    return createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Get file type from MIME
   */
  getFileType(mime) {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'file';
  }

  /**
   * Save to database
   */
  async saveToDatabase(data) {
    const db = getDatabase();

    const result = await db.execute(
      `INSERT INTO cms_media
       (name, hash, ext, mime, size, url, width, height, provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.hash,
        data.ext,
        data.mime,
        data.size,
        data.url,
        data.width || null,
        data.height || null,
        this.provider,
      ]
    );

    return result.lastInsertRowid || result.insertId;
  }

  /**
   * Deserialize media from database
   */
  deserialize(row) {
    return {
      id: row.id,
      name: row.name,
      alternativeText: row.alternative_text,
      caption: row.caption,
      width: row.width,
      height: row.height,
      formats: row.formats ? JSON.parse(row.formats) : null,
      hash: row.hash,
      ext: row.ext,
      mime: row.mime,
      size: row.size,
      url: row.url,
      previewUrl: row.preview_url,
      provider: row.provider,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * Image Processing
 * Generate thumbnails and formats
 */
export class ImageProcessor {
  constructor() {
    this.formats = {
      thumbnail: { width: 156, height: 156 },
      small: { width: 500, height: 500 },
      medium: { width: 750, height: 750 },
      large: { width: 1000, height: 1000 },
    };
  }

  /**
   * Process image and generate formats
   */
  async process(file) {
    // In production, use sharp or similar library
    // For now, return mock formats
    const formats = {};

    for (const [name, size] of Object.entries(this.formats)) {
      formats[name] = {
        name: `${name}_${file.name}`,
        hash: file.hash,
        ext: file.ext,
        mime: file.mime,
        width: size.width,
        height: size.height,
        size: file.size * 0.5, // Simulate smaller size
        url: file.url.replace(file.ext, `_${name}${file.ext}`),
      };
    }

    return formats;
  }
}
