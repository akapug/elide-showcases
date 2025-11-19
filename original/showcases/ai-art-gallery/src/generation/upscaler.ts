/**
 * Upscaler - AI-Powered Image Upscaling System
 *
 * Advanced image upscaling using multiple AI models (ESRGAN, Real-ESRGAN, etc.).
 * Supports batch processing, quality presets, format conversion, and metadata preservation.
 *
 * Features:
 * - Multiple upscaling algorithms (ESRGAN, Real-ESRGAN, Waifu2x)
 * - Configurable upscale factors (2x, 4x, 8x)
 * - Quality presets (fast, balanced, quality)
 * - Batch processing with progress tracking
 * - Format conversion (PNG, JPEG, WebP)
 * - Metadata preservation
 * - Tile-based processing for large images
 *
 * @module upscaler
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Upscale options interface
 */
export interface UpscaleOptions {
  factor: number; // 2, 4, 8
  method?: 'esrgan' | 'real-esrgan' | 'waifu2x' | 'lanczos';
  preset?: 'fast' | 'balanced' | 'quality';
  tileSize?: number;
  tileOverlap?: number;
  denoise?: boolean;
  sharpen?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number; // For JPEG/WebP (1-100)
  preserveMetadata?: boolean;
}

/**
 * Upscale result interface
 */
export interface UpscaleResult {
  image: Buffer;
  metadata: {
    originalSize: { width: number; height: number };
    upscaledSize: { width: number; height: number };
    factor: number;
    method: string;
    processingTime: number;
    fileSize: number;
  };
}

/**
 * Batch upscale progress callback
 */
export type ProgressCallback = (progress: {
  current: number;
  total: number;
  percentage: number;
  currentFile?: string;
}) => void;

/**
 * Upscaler configuration
 */
export interface UpscalerConfig {
  enhancement: any; // Python image enhancement module
  cachePath?: string;
  maxTileSize?: number;
  gpuMemoryLimit?: number;
}

/**
 * Model configuration
 */
interface ModelConfig {
  name: string;
  maxFactor: number;
  supportsTiles: boolean;
  supportsAlpha: boolean;
  speed: 'fast' | 'medium' | 'slow';
}

/**
 * Upscaler
 */
export class Upscaler {
  private enhancement: any;
  private cachePath: string;
  private maxTileSize: number;
  private gpuMemoryLimit: number;
  private models: Map<string, ModelConfig> = new Map();

  constructor(config: UpscalerConfig) {
    this.enhancement = config.enhancement;
    this.cachePath = config.cachePath || './storage/cache/upscale';
    this.maxTileSize = config.maxTileSize || 512;
    this.gpuMemoryLimit = config.gpuMemoryLimit || 8192; // MB

    // Ensure cache directory exists
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
    }

    this.initializeModels();
  }

  /**
   * Upscale single image
   */
  async upscale(
    image: Buffer,
    options: UpscaleOptions
  ): Promise<UpscaleResult> {
    const startTime = Date.now();

    // Validate options
    this.validateOptions(options);

    // Get image dimensions
    const originalSize = await this.getImageDimensions(image);

    // Determine if tiling is needed
    const needsTiling = this.needsTiling(originalSize, options.factor);

    let upscaled: Buffer;

    if (needsTiling) {
      upscaled = await this.upscaleWithTiling(image, options, originalSize);
    } else {
      upscaled = await this.upscaleDirect(image, options);
    }

    // Post-processing
    if (options.denoise) {
      upscaled = await this.enhancement.denoise(upscaled);
    }

    if (options.sharpen && options.sharpen > 0) {
      upscaled = await this.enhancement.sharpen(upscaled, options.sharpen);
    }

    // Convert format if needed
    if (options.format) {
      upscaled = await this.convertFormat(upscaled, options.format, options.quality);
    }

    const upscaledSize = await this.getImageDimensions(upscaled);
    const processingTime = Date.now() - startTime;

    return {
      image: upscaled,
      metadata: {
        originalSize,
        upscaledSize,
        factor: options.factor,
        method: options.method || 'esrgan',
        processingTime,
        fileSize: upscaled.length
      }
    };
  }

  /**
   * Batch upscale multiple images
   */
  async upscaleBatch(
    images: Array<{ id: string; data: Buffer }>,
    options: UpscaleOptions,
    onProgress?: ProgressCallback
  ): Promise<Map<string, UpscaleResult>> {
    const results = new Map<string, UpscaleResult>();
    const total = images.length;

    for (let i = 0; i < images.length; i++) {
      const { id, data } = images[i];

      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: ((i + 1) / total) * 100,
          currentFile: id
        });
      }

      try {
        const result = await this.upscale(data, options);
        results.set(id, result);
      } catch (error) {
        console.error(`Failed to upscale ${id}:`, error);
      }
    }

    return results;
  }

  /**
   * Upscale from file path
   */
  async upscaleFile(
    inputPath: string,
    outputPath: string,
    options: UpscaleOptions
  ): Promise<UpscaleResult> {
    const imageBuffer = fs.readFileSync(inputPath);
    const result = await this.upscale(imageBuffer, options);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save upscaled image
    fs.writeFileSync(outputPath, result.image);

    return result;
  }

  /**
   * Get optimal upscale settings for image
   */
  async getOptimalSettings(
    image: Buffer,
    targetSize?: { width: number; height: number }
  ): Promise<UpscaleOptions> {
    const dimensions = await this.getImageDimensions(image);
    const fileSize = image.length;

    // Calculate required factor
    let factor = 2;
    if (targetSize) {
      const widthFactor = targetSize.width / dimensions.width;
      const heightFactor = targetSize.height / dimensions.height;
      factor = Math.min(8, Math.max(2, Math.ceil(Math.max(widthFactor, heightFactor))));
    }

    // Choose method based on image characteristics
    let method: UpscaleOptions['method'] = 'esrgan';
    let preset: UpscaleOptions['preset'] = 'balanced';

    // Small images can use quality preset
    if (fileSize < 1024 * 1024) { // < 1MB
      preset = 'quality';
    }

    // Large images should use fast preset
    if (fileSize > 10 * 1024 * 1024) { // > 10MB
      preset = 'fast';
    }

    // Very large dimensions need tiling
    const needsTiling = this.needsTiling(dimensions, factor);

    return {
      factor,
      method,
      preset,
      tileSize: needsTiling ? this.maxTileSize : undefined,
      tileOverlap: needsTiling ? 16 : undefined,
      denoise: true,
      sharpen: 0.1,
      format: 'png',
      preserveMetadata: true
    };
  }

  /**
   * Estimate processing time
   */
  async estimateProcessingTime(
    image: Buffer,
    options: UpscaleOptions
  ): Promise<number> {
    const dimensions = await this.getImageDimensions(image);
    const pixels = dimensions.width * dimensions.height;
    const upscaledPixels = pixels * Math.pow(options.factor, 2);

    // Base time per megapixel
    const model = this.models.get(options.method || 'esrgan');
    const speedMultiplier = model?.speed === 'fast' ? 1 : model?.speed === 'medium' ? 2 : 3;

    const baseTimePerMP = 1000; // 1 second per megapixel
    const estimatedTime = (upscaledPixels / 1000000) * baseTimePerMP * speedMultiplier;

    // Add overhead for tiling
    if (this.needsTiling(dimensions, options.factor)) {
      return estimatedTime * 1.3; // 30% overhead for tiling
    }

    return estimatedTime;
  }

  /**
   * Clear upscale cache
   */
  async clearCache(): Promise<void> {
    if (fs.existsSync(this.cachePath)) {
      const files = fs.readdirSync(this.cachePath);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cachePath, file));
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    files: number;
    totalSize: number;
    oldestFile: number;
    newestFile: number;
  }> {
    const stats = {
      files: 0,
      totalSize: 0,
      oldestFile: Date.now(),
      newestFile: 0
    };

    if (!fs.existsSync(this.cachePath)) {
      return stats;
    }

    const files = fs.readdirSync(this.cachePath);

    for (const file of files) {
      const filePath = path.join(this.cachePath, file);
      const fileStat = fs.statSync(filePath);

      stats.files++;
      stats.totalSize += fileStat.size;

      const mtime = fileStat.mtime.getTime();
      if (mtime < stats.oldestFile) stats.oldestFile = mtime;
      if (mtime > stats.newestFile) stats.newestFile = mtime;
    }

    return stats;
  }

  /**
   * Direct upscaling without tiling
   */
  private async upscaleDirect(
    image: Buffer,
    options: UpscaleOptions
  ): Promise<Buffer> {
    const method = options.method || 'esrgan';
    const factor = options.factor;

    return await this.enhancement.upscale(image, {
      method,
      factor,
      preset: options.preset || 'balanced'
    });
  }

  /**
   * Upscale with tiling for large images
   */
  private async upscaleWithTiling(
    image: Buffer,
    options: UpscaleOptions,
    dimensions: { width: number; height: number }
  ): Promise<Buffer> {
    const tileSize = options.tileSize || this.maxTileSize;
    const overlap = options.tileOverlap || 16;
    const factor = options.factor;

    // Calculate tile grid
    const tilesX = Math.ceil(dimensions.width / tileSize);
    const tilesY = Math.ceil(dimensions.height / tileSize);

    console.log(`Processing ${tilesX}x${tilesY} tiles...`);

    // Process each tile
    const tiles: Array<{
      x: number;
      y: number;
      data: Buffer;
    }> = [];

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        // Extract tile with overlap
        const x = tx * tileSize - (tx > 0 ? overlap : 0);
        const y = ty * tileSize - (ty > 0 ? overlap : 0);
        const width = Math.min(
          tileSize + (tx > 0 ? overlap : 0) + (tx < tilesX - 1 ? overlap : 0),
          dimensions.width - x
        );
        const height = Math.min(
          tileSize + (ty > 0 ? overlap : 0) + (ty < tilesY - 1 ? overlap : 0),
          dimensions.height - y
        );

        const tile = await this.extractTile(image, x, y, width, height);

        // Upscale tile
        const upscaledTile = await this.upscaleDirect(tile, options);

        tiles.push({
          x: x * factor,
          y: y * factor,
          data: upscaledTile
        });
      }
    }

    // Merge tiles
    return await this.mergeTiles(
      tiles,
      dimensions.width * factor,
      dimensions.height * factor,
      overlap * factor
    );
  }

  /**
   * Extract tile from image
   */
  private async extractTile(
    image: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    return await this.enhancement.crop(image, { x, y, width, height });
  }

  /**
   * Merge upscaled tiles
   */
  private async mergeTiles(
    tiles: Array<{ x: number; y: number; data: Buffer }>,
    width: number,
    height: number,
    overlap: number
  ): Promise<Buffer> {
    return await this.enhancement.merge_tiles(tiles, width, height, overlap);
  }

  /**
   * Convert image format
   */
  private async convertFormat(
    image: Buffer,
    format: string,
    quality?: number
  ): Promise<Buffer> {
    return await this.enhancement.convert_format(image, {
      format,
      quality: quality || (format === 'jpeg' ? 95 : 100)
    });
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(
    image: Buffer
  ): Promise<{ width: number; height: number }> {
    return await this.enhancement.get_dimensions(image);
  }

  /**
   * Check if tiling is needed
   */
  private needsTiling(
    dimensions: { width: number; height: number },
    factor: number
  ): boolean {
    const upscaledWidth = dimensions.width * factor;
    const upscaledHeight = dimensions.height * factor;

    // Check GPU memory requirements
    const pixelCount = upscaledWidth * upscaledHeight;
    const estimatedMemory = (pixelCount * 4 * 3) / (1024 * 1024); // MB (RGB + overhead)

    if (estimatedMemory > this.gpuMemoryLimit * 0.8) {
      return true;
    }

    // Check if any dimension exceeds max tile size
    return dimensions.width > this.maxTileSize || dimensions.height > this.maxTileSize;
  }

  /**
   * Validate upscale options
   */
  private validateOptions(options: UpscaleOptions): void {
    if (!options.factor || ![2, 4, 8].includes(options.factor)) {
      throw new Error('Factor must be 2, 4, or 8');
    }

    const method = options.method || 'esrgan';
    const model = this.models.get(method);

    if (!model) {
      throw new Error(`Unknown upscale method: ${method}`);
    }

    if (options.factor > model.maxFactor) {
      throw new Error(`${method} supports maximum ${model.maxFactor}x upscaling`);
    }

    if (options.sharpen && (options.sharpen < 0 || options.sharpen > 1)) {
      throw new Error('Sharpen value must be between 0 and 1');
    }

    if (options.quality && (options.quality < 1 || options.quality > 100)) {
      throw new Error('Quality must be between 1 and 100');
    }
  }

  /**
   * Initialize model configurations
   */
  private initializeModels(): void {
    this.models.set('esrgan', {
      name: 'ESRGAN',
      maxFactor: 4,
      supportsTiles: true,
      supportsAlpha: true,
      speed: 'medium'
    });

    this.models.set('real-esrgan', {
      name: 'Real-ESRGAN',
      maxFactor: 4,
      supportsTiles: true,
      supportsAlpha: true,
      speed: 'medium'
    });

    this.models.set('waifu2x', {
      name: 'Waifu2x',
      maxFactor: 2,
      supportsTiles: true,
      supportsAlpha: true,
      speed: 'fast'
    });

    this.models.set('lanczos', {
      name: 'Lanczos',
      maxFactor: 8,
      supportsTiles: false,
      supportsAlpha: true,
      speed: 'fast'
    });
  }

  /**
   * List available models
   */
  listModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get model info
   */
  getModelInfo(method: string): ModelConfig | undefined {
    return this.models.get(method);
  }

  /**
   * Benchmark upscaling performance
   */
  async benchmark(
    testImage: Buffer,
    methods: string[] = ['esrgan', 'real-esrgan', 'waifu2x', 'lanczos']
  ): Promise<Map<string, {
    time: number;
    quality: number;
    fileSize: number;
  }>> {
    const results = new Map();

    for (const method of methods) {
      if (!this.models.has(method)) continue;

      const model = this.models.get(method)!;
      const factor = Math.min(2, model.maxFactor);

      try {
        const startTime = Date.now();
        const result = await this.upscale(testImage, {
          factor,
          method: method as any,
          preset: 'balanced'
        });
        const time = Date.now() - startTime;

        // Simple quality metric (could be enhanced with SSIM/PSNR)
        const quality = this.estimateQuality(result.image);

        results.set(method, {
          time,
          quality,
          fileSize: result.image.length
        });
      } catch (error) {
        console.error(`Benchmark failed for ${method}:`, error);
      }
    }

    return results;
  }

  /**
   * Estimate image quality (simplified)
   */
  private estimateQuality(image: Buffer): number {
    // In real implementation, would use SSIM or other metrics
    // For now, return a placeholder based on file size
    const sizeScore = Math.min(100, (image.length / (1024 * 1024)) * 10);
    return sizeScore;
  }

  /**
   * Create comparison grid
   */
  async createComparisonGrid(
    originalImage: Buffer,
    upscaledResults: Array<{ method: string; image: Buffer }>
  ): Promise<Buffer> {
    // Create a grid showing original + all upscaled versions
    return await this.enhancement.create_comparison_grid({
      original: originalImage,
      results: upscaledResults
    });
  }

  /**
   * Progressive upscaling (multiple passes)
   */
  async upscaleProgressive(
    image: Buffer,
    targetFactor: number,
    options: Omit<UpscaleOptions, 'factor'>
  ): Promise<UpscaleResult> {
    if (![4, 8].includes(targetFactor)) {
      throw new Error('Progressive upscaling only supports 4x and 8x');
    }

    let current = image;
    let currentFactor = 1;

    // Upscale in 2x steps
    while (currentFactor < targetFactor) {
      const result = await this.upscale(current, {
        ...options,
        factor: 2
      });

      current = result.image;
      currentFactor *= 2;
    }

    const finalDimensions = await this.getImageDimensions(current);
    const originalDimensions = await this.getImageDimensions(image);

    return {
      image: current,
      metadata: {
        originalSize: originalDimensions,
        upscaledSize: finalDimensions,
        factor: targetFactor,
        method: options.method || 'esrgan',
        processingTime: 0, // Would track cumulative time
        fileSize: current.length
      }
    };
  }

  /**
   * Smart upscaling with automatic parameter selection
   */
  async upscaleSmart(
    image: Buffer,
    targetResolution: { width: number; height: number }
  ): Promise<UpscaleResult> {
    // Get optimal settings
    const settings = await this.getOptimalSettings(image, targetResolution);

    // Perform upscaling
    const result = await this.upscale(image, settings);

    // If result doesn't match target exactly, perform final resize
    if (
      result.metadata.upscaledSize.width !== targetResolution.width ||
      result.metadata.upscaledSize.height !== targetResolution.height
    ) {
      result.image = await this.enhancement.resize(
        result.image,
        targetResolution.width,
        targetResolution.height,
        'lanczos'
      );

      result.metadata.upscaledSize = targetResolution;
    }

    return result;
  }
}

export default Upscaler;
