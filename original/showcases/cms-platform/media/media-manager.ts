/**
 * CMS Platform - Media Manager
 *
 * Handles media file uploads, storage, organization, and optimization.
 * Supports images, videos, audio, and documents.
 */

import { createHash } from 'crypto';
import { basename, extname, join } from 'path';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  hash: string;
  alt?: string;
  caption?: string;
  metadata: MediaMetadata;
  uploadedBy: string;
  uploadedAt: Date;
  folder?: string;
}

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  thumbnailUrl?: string;
  variants?: MediaVariant[];
}

interface MediaVariant {
  name: string;
  width: number;
  height: number;
  url: string;
  size: number;
}

interface MediaFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  itemCount: number;
  createdAt: Date;
  createdBy: string;
}

interface UploadOptions {
  folder?: string;
  alt?: string;
  caption?: string;
  generateThumbnail?: boolean;
  generateVariants?: boolean;
}

/**
 * Media Manager
 */
export class MediaManager {
  private items: Map<string, MediaItem> = new Map();
  private folders: Map<string, MediaFolder> = new Map();
  private uploadDir: string;
  private baseUrl: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedTypes: Set<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf'
  ]);

  constructor(uploadDir: string = '/uploads', baseUrl: string = '/media') {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;
    this.initializeDefaultFolders();
  }

  /**
   * Initialize default folders
   */
  private initializeDefaultFolders(): void {
    const defaultFolders = [
      { name: 'Images', path: 'images' },
      { name: 'Videos', path: 'videos' },
      { name: 'Audio', path: 'audio' },
      { name: 'Documents', path: 'documents' }
    ];

    defaultFolders.forEach(({ name, path }) => {
      const folder: MediaFolder = {
        id: this.generateId(),
        name,
        path,
        itemCount: 0,
        createdAt: new Date(),
        createdBy: 'system'
      };
      this.folders.set(folder.id, folder);
    });
  }

  /**
   * Upload media file
   */
  async uploadFile(
    file: {
      name: string;
      data: Buffer;
      mimeType: string;
      size: number;
    },
    userId: string,
    options: UploadOptions = {}
  ): Promise<MediaItem> {
    // Validate file
    this.validateFile(file);

    // Check for duplicates
    const fileHash = this.calculateHash(file.data);
    const duplicate = this.findDuplicate(fileHash);

    if (duplicate) {
      console.log(`Duplicate file detected: ${file.name}`);
      return duplicate;
    }

    // Generate unique filename
    const filename = this.generateFilename(file.name);
    const relativePath = options.folder
      ? join(options.folder, filename)
      : filename;
    const fullPath = join(this.uploadDir, relativePath);
    const url = `${this.baseUrl}/${relativePath}`;

    // Extract metadata
    const metadata = await this.extractMetadata(file);

    // Create media item
    const item: MediaItem = {
      id: this.generateId(),
      filename,
      originalName: file.name,
      mimeType: file.mimeType,
      size: file.size,
      path: fullPath,
      url,
      hash: fileHash,
      alt: options.alt,
      caption: options.caption,
      metadata,
      uploadedBy: userId,
      uploadedAt: new Date(),
      folder: options.folder
    };

    // Generate thumbnail for images
    if (options.generateThumbnail !== false && this.isImage(file.mimeType)) {
      const thumbnail = await this.generateThumbnail(file.data, file.mimeType);
      if (thumbnail) {
        item.metadata.thumbnailUrl = thumbnail.url;
      }
    }

    // Generate variants for images
    if (options.generateVariants && this.isImage(file.mimeType)) {
      const variants = await this.generateVariants(file.data, file.mimeType, filename);
      item.metadata.variants = variants;
    }

    // Save to storage (simulated)
    this.items.set(item.id, item);

    // Update folder count
    if (options.folder) {
      this.updateFolderCount(options.folder, 1);
    }

    console.log(`Uploaded file: ${item.filename} (${this.formatFileSize(item.size)})`);

    return item;
  }

  /**
   * Get media item by ID
   */
  getItem(id: string): MediaItem | null {
    return this.items.get(id) || null;
  }

  /**
   * Get media items with filtering
   */
  getItems(filters: {
    folder?: string;
    type?: string;
    search?: string;
    uploadedBy?: string;
  } = {}): MediaItem[] {
    let items = Array.from(this.items.values());

    if (filters.folder !== undefined) {
      items = items.filter(item => item.folder === filters.folder);
    }

    if (filters.type) {
      items = items.filter(item => item.mimeType.startsWith(filters.type));
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      items = items.filter(item =>
        item.originalName.toLowerCase().includes(query) ||
        item.alt?.toLowerCase().includes(query) ||
        item.caption?.toLowerCase().includes(query)
      );
    }

    if (filters.uploadedBy) {
      items = items.filter(item => item.uploadedBy === filters.uploadedBy);
    }

    return items.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  /**
   * Update media item
   */
  async updateItem(id: string, updates: {
    alt?: string;
    caption?: string;
    folder?: string;
  }): Promise<MediaItem> {
    const item = this.items.get(id);

    if (!item) {
      throw new Error('Media item not found');
    }

    // Update folder count if folder changed
    if (updates.folder !== undefined && updates.folder !== item.folder) {
      if (item.folder) {
        this.updateFolderCount(item.folder, -1);
      }
      if (updates.folder) {
        this.updateFolderCount(updates.folder, 1);
      }
      item.folder = updates.folder;
    }

    if (updates.alt !== undefined) {
      item.alt = updates.alt;
    }

    if (updates.caption !== undefined) {
      item.caption = updates.caption;
    }

    return item;
  }

  /**
   * Delete media item
   */
  async deleteItem(id: string): Promise<void> {
    const item = this.items.get(id);

    if (!item) {
      throw new Error('Media item not found');
    }

    // Update folder count
    if (item.folder) {
      this.updateFolderCount(item.folder, -1);
    }

    this.items.delete(id);

    console.log(`Deleted file: ${item.filename}`);
  }

  /**
   * Create folder
   */
  createFolder(name: string, createdBy: string, parentId?: string): MediaFolder {
    let path = this.generateSlug(name);

    // Add parent path if exists
    if (parentId) {
      const parent = this.folders.get(parentId);
      if (parent) {
        path = join(parent.path, path);
      }
    }

    const folder: MediaFolder = {
      id: this.generateId(),
      name,
      path,
      parentId,
      itemCount: 0,
      createdAt: new Date(),
      createdBy
    };

    this.folders.set(folder.id, folder);

    return folder;
  }

  /**
   * Get all folders
   */
  getFolders(): MediaFolder[] {
    return Array.from(this.folders.values());
  }

  /**
   * Get folder by ID
   */
  getFolder(id: string): MediaFolder | null {
    return this.folders.get(id) || null;
  }

  /**
   * Get folder by path
   */
  getFolderByPath(path: string): MediaFolder | null {
    for (const folder of this.folders.values()) {
      if (folder.path === path) {
        return folder;
      }
    }
    return null;
  }

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    const folder = this.folders.get(id);

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.itemCount > 0) {
      throw new Error('Cannot delete folder with items');
    }

    this.folders.delete(id);
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    byType: Map<string, { count: number; size: number }>;
  } {
    const stats = {
      totalFiles: this.items.size,
      totalSize: 0,
      byType: new Map<string, { count: number; size: number }>()
    };

    for (const item of this.items.values()) {
      stats.totalSize += item.size;

      const type = item.mimeType.split('/')[0];
      const typeStats = stats.byType.get(type) || { count: 0, size: 0 };
      typeStats.count++;
      typeStats.size += item.size;
      stats.byType.set(type, typeStats);
    }

    return stats;
  }

  /**
   * Validate file
   */
  private validateFile(file: { name: string; mimeType: string; size: number }): void {
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum of ${this.formatFileSize(this.maxFileSize)}`);
    }

    if (!this.allowedTypes.has(file.mimeType)) {
      throw new Error(`File type ${file.mimeType} is not allowed`);
    }
  }

  /**
   * Find duplicate by hash
   */
  private findDuplicate(hash: string): MediaItem | null {
    for (const item of this.items.values()) {
      if (item.hash === hash) {
        return item;
      }
    }
    return null;
  }

  /**
   * Calculate file hash
   */
  private calculateHash(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string): string {
    const ext = extname(originalName);
    const name = basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${this.generateSlug(name)}-${timestamp}-${random}${ext}`;
  }

  /**
   * Generate slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: {
    data: Buffer;
    mimeType: string;
  }): Promise<MediaMetadata> {
    const metadata: MediaMetadata = {};

    // For images, extract dimensions
    if (this.isImage(file.mimeType)) {
      const dimensions = await this.getImageDimensions(file.data);
      if (dimensions) {
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      }
    }

    return metadata;
  }

  /**
   * Get image dimensions (simulated)
   */
  private async getImageDimensions(data: Buffer): Promise<{ width: number; height: number } | null> {
    // In a real implementation, this would use an image processing library
    // For showcase purposes, return mock dimensions
    return {
      width: 1920,
      height: 1080
    };
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(
    data: Buffer,
    mimeType: string
  ): Promise<{ url: string; width: number; height: number } | null> {
    // In a real implementation, this would use an image processing library
    // For showcase purposes, return mock thumbnail
    return {
      url: '/thumbnails/example-thumb.jpg',
      width: 300,
      height: 200
    };
  }

  /**
   * Generate image variants
   */
  private async generateVariants(
    data: Buffer,
    mimeType: string,
    filename: string
  ): Promise<MediaVariant[]> {
    // In a real implementation, this would generate multiple sizes
    // For showcase purposes, return mock variants
    const sizes = [
      { name: 'small', width: 640, height: 480 },
      { name: 'medium', width: 1280, height: 720 },
      { name: 'large', width: 1920, height: 1080 }
    ];

    return sizes.map(size => ({
      name: size.name,
      width: size.width,
      height: size.height,
      url: `/media/variants/${filename}-${size.name}.jpg`,
      size: Math.floor(data.length * (size.width / 1920))
    }));
  }

  /**
   * Check if mime type is image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Update folder count
   */
  private updateFolderCount(folderPath: string, delta: number): void {
    const folder = this.getFolderByPath(folderPath);
    if (folder) {
      folder.itemCount = Math.max(0, folder.itemCount + delta);
    }
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

// Export singleton instance
export const mediaManager = new MediaManager();
