/**
 * Media Processor
 *
 * Handles image and video processing operations:
 * - Image resizing, optimization, format conversion
 * - Thumbnail generation
 * - Video transcoding simulation
 * - Metadata extraction
 * - Multiple format outputs
 */

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnailUrl?: string;
  variants: MediaVariant[];
  metadata: MediaMetadata;
  userId: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface MediaVariant {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
  size: number;
  format: string;
  quality?: number;
}

export interface MediaMetadata {
  camera?: string;
  location?: { lat: number; lon: number };
  dateTaken?: Date;
  software?: string;
  colorSpace?: string;
  orientation?: number;
  tags: string[];
  alt?: string;
  caption?: string;
}

export interface ProcessingOperation {
  type: 'resize' | 'crop' | 'rotate' | 'convert' | 'optimize' | 'thumbnail' | 'watermark';
  params: Record<string, any>;
}

export interface UploadRequest {
  filename: string;
  data: string; // Base64 or URL
  type: 'image' | 'video' | 'audio' | 'document';
  userId: string;
  metadata?: Partial<MediaMetadata>;
}

export class MediaProcessor {
  private media: Map<string, MediaAsset> = new Map();
  private processingQueue: string[] = [];
  private stats = {
    totalUploads: 0,
    totalProcessed: 0,
    totalSize: 0,
    byType: {} as Record<string, number>
  };

  constructor() {
    this.startProcessingWorker();
    console.log('🎬 Media Processor initialized');
  }

  /**
   * Process file upload
   */
  async processUpload(request: UploadRequest): Promise<MediaAsset> {
    const id = this.generateId();
    const filename = this.sanitizeFilename(request.filename);
    const mimeType = this.getMimeType(filename);

    // Simulate file size calculation
    const size = this.calculateSize(request.data);

    const asset: MediaAsset = {
      id,
      filename,
      originalName: request.filename,
      type: request.type,
      mimeType,
      size,
      url: `/cdn/media/${id}/${filename}`,
      variants: [],
      metadata: {
        tags: request.metadata?.tags || [],
        alt: request.metadata?.alt,
        caption: request.metadata?.caption
      },
      userId: request.userId,
      uploadedAt: new Date(),
      status: 'processing'
    };

    // Extract dimensions for images
    if (request.type === 'image') {
      const dimensions = this.extractImageDimensions(request.data);
      asset.width = dimensions.width;
      asset.height = dimensions.height;
    }

    // Extract duration for videos
    if (request.type === 'video') {
      asset.duration = this.extractVideoDuration(request.data);
    }

    this.media.set(id, asset);
    this.stats.totalUploads++;
    this.stats.byType[request.type] = (this.stats.byType[request.type] || 0) + 1;
    this.stats.totalSize += size;

    // Add to processing queue
    this.processingQueue.push(id);

    return asset;
  }

  /**
   * Process media with operations
   */
  async processMedia(id: string, operations: ProcessingOperation[]): Promise<MediaAsset | null> {
    const asset = this.media.get(id);
    if (!asset) return null;

    asset.status = 'processing';

    try {
      for (const operation of operations) {
        await this.applyOperation(asset, operation);
      }

      asset.status = 'ready';
      asset.processedAt = new Date();
      this.stats.totalProcessed++;

      return asset;
    } catch (error) {
      asset.status = 'error';
      asset.error = (error as Error).message;
      return asset;
    }
  }

  /**
   * Apply processing operation
   */
  private async applyOperation(asset: MediaAsset, operation: ProcessingOperation): Promise<void> {
    switch (operation.type) {
      case 'resize':
        await this.resizeImage(asset, operation.params);
        break;
      case 'crop':
        await this.cropImage(asset, operation.params);
        break;
      case 'rotate':
        await this.rotateImage(asset, operation.params);
        break;
      case 'convert':
        await this.convertFormat(asset, operation.params);
        break;
      case 'optimize':
        await this.optimizeMedia(asset, operation.params);
        break;
      case 'thumbnail':
        await this.generateThumbnail(asset, operation.params);
        break;
      case 'watermark':
        await this.addWatermark(asset, operation.params);
        break;
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }

  /**
   * Resize image
   */
  private async resizeImage(asset: MediaAsset, params: { width?: number; height?: number; fit?: string }): Promise<void> {
    if (asset.type !== 'image') {
      throw new Error('Can only resize images');
    }

    const { width, height, fit = 'cover' } = params;

    if (!width && !height) {
      throw new Error('Must specify width or height');
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = asset.width! / asset.height!;
    let newWidth = width || Math.round(height! * aspectRatio);
    let newHeight = height || Math.round(width! / aspectRatio);

    // Simulate processing time
    await this.simulateProcessing(100);

    // Create variant
    const variant: MediaVariant = {
      id: this.generateId(),
      name: `${newWidth}x${newHeight}`,
      url: `/cdn/media/${asset.id}/${newWidth}x${newHeight}.${this.getExtension(asset.filename)}`,
      width: newWidth,
      height: newHeight,
      size: Math.round(asset.size * (newWidth * newHeight) / (asset.width! * asset.height!)),
      format: this.getExtension(asset.filename)
    };

    asset.variants.push(variant);
  }

  /**
   * Crop image
   */
  private async cropImage(asset: MediaAsset, params: { x: number; y: number; width: number; height: number }): Promise<void> {
    if (asset.type !== 'image') {
      throw new Error('Can only crop images');
    }

    const { x, y, width, height } = params;

    await this.simulateProcessing(80);

    const variant: MediaVariant = {
      id: this.generateId(),
      name: `cropped-${width}x${height}`,
      url: `/cdn/media/${asset.id}/cropped-${width}x${height}.${this.getExtension(asset.filename)}`,
      width,
      height,
      size: Math.round(asset.size * (width * height) / (asset.width! * asset.height!)),
      format: this.getExtension(asset.filename)
    };

    asset.variants.push(variant);
  }

  /**
   * Rotate image
   */
  private async rotateImage(asset: MediaAsset, params: { degrees: number }): Promise<void> {
    if (asset.type !== 'image') {
      throw new Error('Can only rotate images');
    }

    await this.simulateProcessing(50);

    const { degrees } = params;
    const isPortraitFlip = degrees === 90 || degrees === 270;

    const variant: MediaVariant = {
      id: this.generateId(),
      name: `rotated-${degrees}`,
      url: `/cdn/media/${asset.id}/rotated-${degrees}.${this.getExtension(asset.filename)}`,
      width: isPortraitFlip ? asset.height : asset.width,
      height: isPortraitFlip ? asset.width : asset.height,
      size: asset.size,
      format: this.getExtension(asset.filename)
    };

    asset.variants.push(variant);
  }

  /**
   * Convert image format
   */
  private async convertFormat(asset: MediaAsset, params: { format: string; quality?: number }): Promise<void> {
    const { format, quality = 85 } = params;

    await this.simulateProcessing(120);

    // Estimate size based on format and quality
    const compressionRatio = this.getCompressionRatio(format, quality);
    const newSize = Math.round(asset.size * compressionRatio);

    const variant: MediaVariant = {
      id: this.generateId(),
      name: `converted-${format}`,
      url: `/cdn/media/${asset.id}/converted.${format}`,
      width: asset.width,
      height: asset.height,
      size: newSize,
      format,
      quality
    };

    asset.variants.push(variant);
  }

  /**
   * Optimize media
   */
  private async optimizeMedia(asset: MediaAsset, params: { quality?: number; progressive?: boolean }): Promise<void> {
    const { quality = 85, progressive = true } = params;

    await this.simulateProcessing(150);

    const optimizedSize = Math.round(asset.size * 0.6); // Simulate 40% reduction

    const variant: MediaVariant = {
      id: this.generateId(),
      name: 'optimized',
      url: `/cdn/media/${asset.id}/optimized.${this.getExtension(asset.filename)}`,
      width: asset.width,
      height: asset.height,
      size: optimizedSize,
      format: this.getExtension(asset.filename),
      quality
    };

    asset.variants.push(variant);
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(asset: MediaAsset, params: { width?: number; height?: number }): Promise<void> {
    const width = params.width || 150;
    const height = params.height || 150;

    await this.simulateProcessing(60);

    const thumbnailUrl = `/cdn/media/${asset.id}/thumb-${width}x${height}.jpg`;
    asset.thumbnailUrl = thumbnailUrl;

    const variant: MediaVariant = {
      id: this.generateId(),
      name: 'thumbnail',
      url: thumbnailUrl,
      width,
      height,
      size: Math.round(asset.size * 0.05), // Thumbnails are ~5% of original
      format: 'jpg',
      quality: 80
    };

    asset.variants.push(variant);
  }

  /**
   * Add watermark
   */
  private async addWatermark(asset: MediaAsset, params: { text?: string; position?: string; opacity?: number }): Promise<void> {
    if (asset.type !== 'image') {
      throw new Error('Can only watermark images');
    }

    const { text = '© Copyright', position = 'bottom-right', opacity = 0.5 } = params;

    await this.simulateProcessing(100);

    const variant: MediaVariant = {
      id: this.generateId(),
      name: 'watermarked',
      url: `/cdn/media/${asset.id}/watermarked.${this.getExtension(asset.filename)}`,
      width: asset.width,
      height: asset.height,
      size: asset.size,
      format: this.getExtension(asset.filename)
    };

    asset.variants.push(variant);
  }

  /**
   * Generate responsive image variants
   */
  async generateResponsiveVariants(id: string): Promise<MediaAsset | null> {
    const asset = this.media.get(id);
    if (!asset || asset.type !== 'image') return null;

    const sizes = [
      { name: 'small', width: 640 },
      { name: 'medium', width: 1024 },
      { name: 'large', width: 1920 },
      { name: 'xlarge', width: 2560 }
    ];

    for (const size of sizes) {
      if (size.width < asset.width!) {
        await this.resizeImage(asset, { width: size.width });
      }
    }

    // Generate WebP variants for modern browsers
    await this.convertFormat(asset, { format: 'webp', quality: 85 });

    // Generate thumbnail
    await this.generateThumbnail(asset, { width: 300, height: 300 });

    return asset;
  }

  /**
   * Transcode video (simulation)
   */
  async transcodeVideo(id: string, formats: string[]): Promise<MediaAsset | null> {
    const asset = this.media.get(id);
    if (!asset || asset.type !== 'video') return null;

    for (const format of formats) {
      await this.simulateProcessing(500); // Videos take longer

      const variant: MediaVariant = {
        id: this.generateId(),
        name: `transcoded-${format}`,
        url: `/cdn/media/${asset.id}/transcoded.${format}`,
        size: Math.round(asset.size * 0.8),
        format
      };

      asset.variants.push(variant);
    }

    // Generate video thumbnail
    await this.generateThumbnail(asset, { width: 640, height: 360 });

    return asset;
  }

  /**
   * Get media by ID
   */
  getMedia(id: string): MediaAsset | null {
    return this.media.get(id) || null;
  }

  /**
   * List media with filtering
   */
  listMedia(filter: { type?: string; userId?: string; page?: number; limit?: number }): {
    items: MediaAsset[];
    total: number;
    page: number;
    limit: number;
  } {
    let items = Array.from(this.media.values());

    if (filter.type) {
      items = items.filter(m => m.type === filter.type);
    }

    if (filter.userId) {
      items = items.filter(m => m.userId === filter.userId);
    }

    // Sort by upload date (newest first)
    items.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    const total = items.length;
    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit
    };
  }

  /**
   * Delete media
   */
  deleteMedia(id: string, userId: string): boolean {
    const asset = this.media.get(id);
    if (!asset || asset.userId !== userId) return false;

    this.media.delete(id);
    this.stats.totalSize -= asset.size;

    return true;
  }

  /**
   * Get media statistics
   */
  getStats(): any {
    return {
      ...this.stats,
      queueSize: this.processingQueue.length,
      totalSizeMB: Math.round(this.stats.totalSize / 1024 / 1024)
    };
  }

  /**
   * Background processing worker
   */
  private startProcessingWorker(): void {
    setInterval(async () => {
      if (this.processingQueue.length === 0) return;

      const id = this.processingQueue.shift();
      if (!id) return;

      const asset = this.media.get(id);
      if (!asset) return;

      try {
        // Auto-generate responsive variants for images
        if (asset.type === 'image') {
          await this.generateResponsiveVariants(id);
        }

        // Auto-generate thumbnail for videos
        if (asset.type === 'video') {
          await this.generateThumbnail(asset, { width: 640, height: 360 });
        }

        asset.status = 'ready';
        asset.processedAt = new Date();
        this.stats.totalProcessed++;
      } catch (error) {
        asset.status = 'error';
        asset.error = (error as Error).message;
      }
    }, 1000); // Process one item per second
  }

  /**
   * Utility functions
   */

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  }

  private getMimeType(filename: string): string {
    const ext = this.getExtension(filename);
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      pdf: 'application/pdf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private calculateSize(data: string): number {
    // Rough estimation based on data string length
    return Math.round(data.length * 0.75); // Base64 overhead
  }

  private extractImageDimensions(data: string): { width: number; height: number } {
    // Simulate dimension extraction
    return {
      width: 1920 + Math.floor(Math.random() * 1000),
      height: 1080 + Math.floor(Math.random() * 1000)
    };
  }

  private extractVideoDuration(data: string): number {
    // Simulate duration extraction (in seconds)
    return 60 + Math.floor(Math.random() * 300);
  }

  private getCompressionRatio(format: string, quality: number): number {
    const ratios: Record<string, number> = {
      jpg: 0.7,
      jpeg: 0.7,
      png: 0.9,
      webp: 0.5,
      gif: 0.8
    };
    const baseRatio = ratios[format] || 1;
    return baseRatio * (quality / 100);
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
