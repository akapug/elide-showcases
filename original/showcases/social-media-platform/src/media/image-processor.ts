/**
 * Image Processor - Image Upload and Processing
 *
 * Handles image processing using:
 * - python:cv2 for image manipulation (resize, filters, effects)
 * - python:PIL for advanced image operations
 * - python:numpy for numerical processing
 *
 * Provides thumbnail generation, filters, and image enhancement.
 */

// @ts-ignore
import cv2 from 'python:cv2';
// @ts-ignore
import PIL from 'python:PIL';
// @ts-ignore
import numpy from 'python:numpy';

import type { ProcessedImage, ImageFeatures, MediaMetadata } from '../types';

/**
 * Image processor configuration
 */
export interface ImageProcessorConfig {
  // Size limits
  maxFileSize: number; // bytes
  maxWidth: number;
  maxHeight: number;

  // Thumbnail sizes
  thumbnailSizes: Array<{ width: number; height: number; name: string }>;

  // Quality
  jpegQuality: number;
  pngCompression: number;
  webpQuality: number;

  // Features
  enableAutoEnhancement: boolean;
  enableFaceDetection: boolean;
  enableObjectDetection: boolean;
  enableColorExtraction: boolean;

  // Filters
  availableFilters: string[];

  // Performance
  maxConcurrentProcessing: number;
  processingTimeout: number;
}

const DEFAULT_CONFIG: ImageProcessorConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxWidth: 4096,
  maxHeight: 4096,
  thumbnailSizes: [
    { width: 150, height: 150, name: 'thumbnail' },
    { width: 600, height: 600, name: 'preview' },
    { width: 1920, height: 1920, name: 'full' },
  ],
  jpegQuality: 85,
  pngCompression: 6,
  webpQuality: 80,
  enableAutoEnhancement: true,
  enableFaceDetection: true,
  enableObjectDetection: false,
  enableColorExtraction: true,
  availableFilters: [
    'grayscale', 'sepia', 'blur', 'sharpen', 'edge', 'vintage',
    'warm', 'cool', 'contrast', 'brightness', 'saturation'
  ],
  maxConcurrentProcessing: 4,
  processingTimeout: 30000,
};

/**
 * ImageProcessor - Main image processing class
 */
export class ImageProcessor {
  private config: ImageProcessorConfig;
  private processingQueue: Set<string>;

  constructor(config: Partial<ImageProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.processingQueue = new Set();
  }

  /**
   * Process uploaded image
   */
  async processUpload(imageBuffer: Buffer, options: any = {}): Promise<ProcessedImage> {
    // Validate file size
    if (imageBuffer.length > this.config.maxFileSize) {
      throw new Error(`Image exceeds maximum size of ${this.config.maxFileSize} bytes`);
    }

    // Convert buffer to cv2 image
    const image = this.bufferToImage(imageBuffer);

    // Validate dimensions
    const [height, width] = image.shape;
    if (width > this.config.maxWidth || height > this.config.maxHeight) {
      throw new Error(`Image dimensions exceed maximum of ${this.config.maxWidth}x${this.config.maxHeight}`);
    }

    // Auto-enhance if enabled
    const enhanced = this.config.enableAutoEnhancement
      ? await this.autoEnhance(image)
      : image;

    // Generate thumbnails
    const thumbnails: Record<string, Buffer> = {};
    for (const size of this.config.thumbnailSizes) {
      const resized = this.resize(enhanced, size.width, size.height);
      thumbnails[size.name] = this.imageToBuffer(resized);
    }

    // Apply filter if requested
    const filtered = options.filter
      ? await this.applyFilter(enhanced, options.filter)
      : enhanced;

    // Extract features
    const features = await this.extractFeatures(enhanced);

    // Extract metadata
    const metadata = await this.extractMetadata(imageBuffer);

    return {
      imageId: this.generateId(),
      thumbnail: thumbnails.thumbnail,
      preview: thumbnails.preview,
      full: this.imageToBuffer(filtered),
      metadata,
      features,
    };
  }

  /**
   * Apply image filter
   */
  async applyFilter(image: any, filterName: string): Promise<any> {
    if (!this.config.availableFilters.includes(filterName)) {
      throw new Error(`Unknown filter: ${filterName}`);
    }

    switch (filterName) {
      case 'grayscale':
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);

      case 'sepia':
        return this.applySepia(image);

      case 'blur':
        return cv2.GaussianBlur(image, [15, 15], 0);

      case 'sharpen':
        return this.applySharpen(image);

      case 'edge':
        return cv2.Canny(image, 100, 200);

      case 'vintage':
        return this.applyVintage(image);

      case 'warm':
        return this.adjustTemperature(image, 20);

      case 'cool':
        return this.adjustTemperature(image, -20);

      case 'contrast':
        return this.adjustContrast(image, 1.3);

      case 'brightness':
        return this.adjustBrightness(image, 20);

      case 'saturation':
        return this.adjustSaturation(image, 1.3);

      default:
        return image;
    }
  }

  /**
   * Auto-enhance image
   */
  async autoEnhance(image: any): Promise<any> {
    // Convert to LAB color space
    const lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB);

    // Split channels
    const [l, a, b] = cv2.split(lab);

    // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    const clahe = cv2.createCLAHE({ clipLimit: 2.0, tileGridSize: [8, 8] });
    const enhancedL = clahe.apply(l);

    // Merge channels
    const enhanced = cv2.merge([enhancedL, a, b]);

    // Convert back to BGR
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR);
  }

  /**
   * Resize image maintaining aspect ratio
   */
  resize(image: any, maxWidth: number, maxHeight: number): any {
    const [height, width] = image.shape;
    const aspectRatio = width / height;

    let newWidth = maxWidth;
    let newHeight = maxHeight;

    if (width > height) {
      newHeight = Math.floor(maxWidth / aspectRatio);
    } else {
      newWidth = Math.floor(maxHeight * aspectRatio);
    }

    return cv2.resize(image, [newWidth, newHeight], { interpolation: cv2.INTER_AREA });
  }

  /**
   * Apply sepia filter
   */
  applySepia(image: any): any {
    const kernel = numpy.array([
      [0.272, 0.534, 0.131],
      [0.349, 0.686, 0.168],
      [0.393, 0.769, 0.189]
    ]);
    return cv2.transform(image, kernel);
  }

  /**
   * Apply sharpen filter
   */
  applySharpen(image: any): any {
    const kernel = numpy.array([
      [-1, -1, -1],
      [-1,  9, -1],
      [-1, -1, -1]
    ]);
    return cv2.filter2D(image, -1, kernel);
  }

  /**
   * Apply vintage filter
   */
  applyVintage(image: any): any {
    // Apply sepia
    let vintage = this.applySepia(image);

    // Add vignette
    vintage = this.applyVignette(vintage, 0.5);

    // Reduce saturation
    vintage = this.adjustSaturation(vintage, 0.7);

    return vintage;
  }

  /**
   * Apply vignette effect
   */
  applyVignette(image: any, strength: number = 0.5): any {
    const [height, width] = image.shape;
    const center = [width / 2, height / 2];

    // Create mask
    const y = numpy.arange(0, height);
    const x = numpy.arange(0, width);
    const [xx, yy] = numpy.meshgrid(x, y);

    const dist = numpy.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2);
    const maxDist = numpy.sqrt(center[0] ** 2 + center[1] ** 2);
    const vignette = 1 - (dist / maxDist) ** 2 * strength;

    // Apply vignette
    return image * vignette.reshape(height, width, 1);
  }

  /**
   * Adjust temperature (warm/cool)
   */
  adjustTemperature(image: any, value: number): any {
    const adjusted = image.copy();

    if (value > 0) {
      // Warm: increase red, decrease blue
      adjusted[:, :, 2] = numpy.clip(adjusted[:, :, 2] + value, 0, 255);
      adjusted[:, :, 0] = numpy.clip(adjusted[:, :, 0] - value / 2, 0, 255);
    } else {
      // Cool: decrease red, increase blue
      adjusted[:, :, 2] = numpy.clip(adjusted[:, :, 2] + value, 0, 255);
      adjusted[:, :, 0] = numpy.clip(adjusted[:, :, 0] - value, 0, 255);
    }

    return adjusted;
  }

  /**
   * Adjust contrast
   */
  adjustContrast(image: any, factor: number): any {
    const mean = image.mean();
    return numpy.clip((image - mean) * factor + mean, 0, 255).astype(numpy.uint8);
  }

  /**
   * Adjust brightness
   */
  adjustBrightness(image: any, value: number): any {
    return numpy.clip(image + value, 0, 255).astype(numpy.uint8);
  }

  /**
   * Adjust saturation
   */
  adjustSaturation(image: any, factor: number): any {
    const hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV);
    hsv[:, :, 1] = numpy.clip(hsv[:, :, 1] * factor, 0, 255);
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR);
  }

  /**
   * Extract image features
   */
  async extractFeatures(image: any): Promise<ImageFeatures> {
    const features: ImageFeatures = {
      dominantColors: [],
      faces: [],
      objects: [],
      scenes: [],
      aesthetic: {
        overall: 0.5,
        composition: 0.5,
        lighting: 0.5,
        colorHarmony: 0.5,
        sharpness: 0.5,
      },
      quality: 0.5,
    };

    // Extract dominant colors
    if (this.config.enableColorExtraction) {
      features.dominantColors = this.extractDominantColors(image);
    }

    // Detect faces
    if (this.config.enableFaceDetection) {
      features.faces = this.detectFaces(image);
    }

    // Assess quality
    features.quality = this.assessQuality(image);

    // Calculate aesthetic score
    features.aesthetic = this.calculateAesthetic(image);

    return features;
  }

  /**
   * Extract dominant colors using k-means
   */
  extractDominantColors(image: any, numColors: number = 5): string[] {
    // Reshape image
    const pixels = image.reshape(-1, 3);
    const pixelsFloat = numpy.float32(pixels);

    // K-means clustering
    const criteria = [cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2];
    const [_, labels, centers] = cv2.kmeans(
      pixelsFloat,
      numColors,
      null,
      criteria,
      10,
      cv2.KMEANS_RANDOM_CENTERS
    );

    // Convert BGR to hex
    const colors: string[] = [];
    for (let i = 0; i < numColors; i++) {
      const [b, g, r] = centers[i];
      const hex = `#${this.toHex(r)}${this.toHex(g)}${this.toHex(b)}`;
      colors.push(hex);
    }

    return colors;
  }

  /**
   * Detect faces using Haar Cascade
   */
  detectFaces(image: any): any[] {
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
    const faceCascade = cv2.CascadeClassifier(
      cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    );

    const faces = faceCascade.detectMultiScale(
      gray,
      { scaleFactor: 1.1, minNeighbors: 5, minSize: [30, 30] }
    );

    return Array.from(faces).map(([x, y, w, h]) => ({
      boundingBox: { x, y, width: w, height: h },
      confidence: 0.85,
    }));
  }

  /**
   * Assess image quality
   */
  assessQuality(image: any): number {
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);

    // Laplacian variance (blur detection)
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    const variance = laplacian.var();

    // Normalize to 0-1
    return Math.min(variance / 1000, 1.0);
  }

  /**
   * Calculate aesthetic score
   */
  calculateAesthetic(image: any): any {
    const [height, width] = image.shape;

    // Composition (rule of thirds)
    const composition = this.scoreComposition(width, height);

    // Lighting (brightness distribution)
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY);
    const meanBrightness = gray.mean() / 255;
    const lighting = 1.0 - Math.abs(meanBrightness - 0.5) * 2;

    // Color harmony
    const colorHarmony = this.scoreColorHarmony(image);

    // Sharpness
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    const sharpness = Math.min(laplacian.var() / 1000, 1.0);

    const overall = (composition + lighting + colorHarmony + sharpness) / 4;

    return {
      overall,
      composition,
      lighting,
      colorHarmony,
      sharpness,
    };
  }

  /**
   * Score composition
   */
  scoreComposition(width: number, height: number): number {
    const aspectRatio = width / height;
    const goldenRatio = 1.618;
    const distance = Math.abs(aspectRatio - goldenRatio);
    return Math.max(0, 1.0 - distance);
  }

  /**
   * Score color harmony
   */
  scoreColorHarmony(image: any): number {
    // Simplified color harmony based on saturation variance
    const hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV);
    const saturation = hsv[:, :, 1];
    const variance = saturation.var();

    // Lower variance = more harmonious
    return Math.max(0, 1.0 - variance / 10000);
  }

  /**
   * Extract metadata
   */
  async extractMetadata(imageBuffer: Buffer): Promise<MediaMetadata> {
    // In production, would extract EXIF data using PIL
    return {
      mimeType: 'image/jpeg',
      originalFilename: 'image.jpg',
      uploadedAt: new Date(),
    };
  }

  /**
   * Convert buffer to cv2 image
   */
  bufferToImage(buffer: Buffer): any {
    const npArray = numpy.frombuffer(buffer, dtype=numpy.uint8);
    return cv2.imdecode(npArray, cv2.IMREAD_COLOR);
  }

  /**
   * Convert cv2 image to buffer
   */
  imageToBuffer(image: any, format: string = 'jpg'): Buffer {
    const ext = `.${format}`;
    const [success, encoded] = cv2.imencode(ext, image, [
      cv2.IMWRITE_JPEG_QUALITY, this.config.jpegQuality
    ]);

    if (!success) {
      throw new Error('Failed to encode image');
    }

    return Buffer.from(encoded);
  }

  /**
   * Helper methods
   */

  toHex(value: number): string {
    const hex = Math.round(value).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats(): any {
    return {
      processingQueueSize: this.processingQueue.size,
      config: this.config,
    };
  }
}

/**
 * Create a default ImageProcessor instance
 */
export function createImageProcessor(config?: Partial<ImageProcessorConfig>): ImageProcessor {
  return new ImageProcessor(config);
}
