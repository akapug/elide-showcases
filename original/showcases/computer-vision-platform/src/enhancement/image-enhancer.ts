/**
 * Computer Vision Platform - Image Enhancement
 *
 * Advanced image enhancement using OpenCV DNN via Elide's polyglot bridge
 * Demonstrates seamless Python-TypeScript integration
 */

// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import {
  ImageData,
  EnhancementConfig,
  SuperResolutionConfig,
  ImageEnhancementResult,
} from '../types.js';

// ============================================================================
// Enhancement Types
// ============================================================================

export interface ImageEnhancerConfig {
  defaultScale?: number;
  defaultModel?: SuperResolutionModel;
  enableGPU?: boolean;
}

export enum SuperResolutionModel {
  ESPCN = 'espcn', // Efficient Sub-Pixel Convolutional Neural Network
  FSRCNN = 'fsrcnn', // Fast Super-Resolution Convolutional Neural Network
  EDSR = 'edsr', // Enhanced Deep Super-Resolution
  LAPSRN = 'lapsrn', // Laplacian Pyramid Super-Resolution Network
}

export interface DenoiseConfig {
  h?: number; // Filter strength
  templateWindowSize?: number;
  searchWindowSize?: number;
  method?: 'nlmeans' | 'bilateral' | 'gaussian';
}

export interface SharpenConfig {
  amount?: number; // 0-2
  radius?: number;
  threshold?: number;
  method?: 'unsharp' | 'laplacian' | 'highpass';
}

export interface HDRConfig {
  gamma?: number;
  saturation?: number;
  contrast?: number;
  exposure?: number;
}

export interface ToneMappingConfig {
  gamma?: number;
  saturation?: number;
  bias?: number;
  method?: 'drago' | 'reinhard' | 'mantiuk';
}

export interface LowLightConfig {
  gamma?: number;
  gain?: number;
  method?: 'clahe' | 'gamma' | 'retinex';
}

export interface ColorGradingConfig {
  temperature?: number; // -100 to 100
  tint?: number; // -100 to 100
  vibrance?: number; // -100 to 100
  saturation?: number; // -100 to 100
}

export interface NoiseReductionResult {
  denoised: ImageData;
  noiseLevel: number;
  snrImprovement: number;
}

export interface DetailEnhancementResult {
  enhanced: ImageData;
  detailLevel: number;
  sharpnessScore: number;
}

export interface DynamicRangeResult {
  enhanced: ImageData;
  dynamicRange: number;
  contrastRatio: number;
}

// ============================================================================
// Image Enhancer Class
// ============================================================================

export class ImageEnhancer {
  private config: Required<ImageEnhancerConfig>;
  private srModels: Map<string, any> = new Map();
  private modelPaths: Map<SuperResolutionModel, string> = new Map();

  constructor(config: ImageEnhancerConfig = {}) {
    this.config = {
      defaultScale: config.defaultScale ?? 2,
      defaultModel: config.defaultModel ?? SuperResolutionModel.ESPCN,
      enableGPU: config.enableGPU ?? false,
    };

    this.initializeModelPaths();
  }

  private initializeModelPaths(): void {
    // Model paths (would be actual paths in production)
    this.modelPaths.set(
      SuperResolutionModel.ESPCN,
      'models/ESPCN_x{scale}.pb'
    );
    this.modelPaths.set(
      SuperResolutionModel.FSRCNN,
      'models/FSRCNN_x{scale}.pb'
    );
    this.modelPaths.set(
      SuperResolutionModel.EDSR,
      'models/EDSR_x{scale}.pb'
    );
    this.modelPaths.set(
      SuperResolutionModel.LAPSRN,
      'models/LapSRN_x{scale}.pb'
    );
  }

  /**
   * Apply super-resolution to increase image resolution
   */
  async superResolve(
    image: ImageData,
    config: SuperResolutionConfig
  ): Promise<ImageData> {
    const startTime = Date.now();

    const scale = config.scale ?? this.config.defaultScale;
    const model = config.model ?? this.config.defaultModel;

    // Load or get cached model
    const sr = this.getSuperResolutionModel(model, scale);

    // Prepare image
    let input = image.data;
    if (image.channels === 4) {
      input = cv2.cvtColor(input, cv2.COLOR_BGRA2BGR);
    }

    // Perform super-resolution
    sr.setInput(input);
    const result = sr.upsample(input);

    const processingTime = Date.now() - startTime;
    console.log(`Super-resolution (${scale}x): ${processingTime}ms`);

    return {
      data: result,
      width: image.width * scale,
      height: image.height * scale,
      channels: 3,
      dtype: 'uint8',
    };
  }

  private getSuperResolutionModel(model: SuperResolutionModel, scale: number): any {
    const key = `${model}_${scale}`;

    if (!this.srModels.has(key)) {
      let sr: any;

      switch (model) {
        case SuperResolutionModel.ESPCN:
          sr = cv2.dnn_superres.DnnSuperResImpl_create();
          break;
        case SuperResolutionModel.FSRCNN:
          sr = cv2.dnn_superres.DnnSuperResImpl_create();
          break;
        case SuperResolutionModel.EDSR:
          sr = cv2.dnn_superres.DnnSuperResImpl_create();
          break;
        case SuperResolutionModel.LAPSRN:
          sr = cv2.dnn_superres.DnnSuperResImpl_create();
          break;
      }

      // In production, would load actual model file
      // const modelPath = this.modelPaths.get(model)!.replace('{scale}', scale.toString());
      // sr.readModel(modelPath);
      // sr.setModel(model, scale);

      this.srModels.set(key, sr);
    }

    return this.srModels.get(key);
  }

  /**
   * Denoise image while preserving details
   */
  denoise(image: ImageData, config: DenoiseConfig = {}): NoiseReductionResult {
    const startTime = Date.now();

    const {
      h = 10,
      templateWindowSize = 7,
      searchWindowSize = 21,
      method = 'nlmeans',
    } = config;

    let denoised: any;
    const input = image.data;

    switch (method) {
      case 'nlmeans':
        if (image.channels === 3 || image.channels === 4) {
          denoised = cv2.fastNlMeansDenoisingColored(
            input,
            null,
            h,
            h,
            templateWindowSize,
            searchWindowSize
          );
        } else {
          denoised = cv2.fastNlMeansDenoising(
            input,
            null,
            h,
            templateWindowSize,
            searchWindowSize
          );
        }
        break;

      case 'bilateral':
        denoised = cv2.bilateralFilter(input, 9, 75, 75);
        break;

      case 'gaussian':
        denoised = cv2.GaussianBlur(input, [5, 5], 0);
        break;
    }

    // Calculate noise level improvement
    const noiseLevel = this.estimateNoiseLevel(input);
    const denoisedNoiseLevel = this.estimateNoiseLevel(denoised);
    const snrImprovement = noiseLevel - denoisedNoiseLevel;

    const processingTime = Date.now() - startTime;
    console.log(`Denoising (${method}): ${processingTime}ms`);

    return {
      denoised: {
        data: denoised,
        width: image.width,
        height: image.height,
        channels: image.channels,
        dtype: image.dtype,
      },
      noiseLevel: denoisedNoiseLevel,
      snrImprovement,
    };
  }

  /**
   * Sharpen image to enhance details
   */
  sharpen(image: ImageData, config: SharpenConfig = {}): DetailEnhancementResult {
    const startTime = Date.now();

    const {
      amount = 1.0,
      radius = 1.0,
      threshold = 0,
      method = 'unsharp',
    } = config;

    let sharpened: any;
    const input = image.data;

    switch (method) {
      case 'unsharp':
        sharpened = this.unsharpMask(input, amount, radius, threshold);
        break;

      case 'laplacian':
        sharpened = this.laplacianSharpen(input, amount);
        break;

      case 'highpass':
        sharpened = this.highPassSharpen(input, amount);
        break;
    }

    const sharpnessScore = this.calculateSharpness(sharpened);

    const processingTime = Date.now() - startTime;
    console.log(`Sharpening (${method}): ${processingTime}ms`);

    return {
      enhanced: {
        data: sharpened,
        width: image.width,
        height: image.height,
        channels: image.channels,
        dtype: image.dtype,
      },
      detailLevel: amount,
      sharpnessScore,
    };
  }

  private unsharpMask(
    image: any,
    amount: number,
    radius: number,
    threshold: number
  ): any {
    const blurred = cv2.GaussianBlur(image, [0, 0], radius);
    const sharpened = cv2.addWeighted(image, 1 + amount, blurred, -amount, 0);

    if (threshold > 0) {
      const diff = cv2.absdiff(image, blurred);
      const mask = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)[1];
      return numpy.where(mask, sharpened, image);
    }

    return sharpened;
  }

  private laplacianSharpen(image: any, amount: number): any {
    const kernel = numpy.array([
      [0, -1, 0],
      [-1, 5 + amount, -1],
      [0, -1, 0],
    ], dtype: numpy.float32);

    return cv2.filter2D(image, -1, kernel);
  }

  private highPassSharpen(image: any, amount: number): any {
    const lowpass = cv2.GaussianBlur(image, [0, 0], 2);
    const highpass = cv2.subtract(image, lowpass);
    return cv2.add(image, cv2.multiply(highpass, amount));
  }

  /**
   * Apply HDR tone mapping for better dynamic range
   */
  applyHDR(image: ImageData, config: HDRConfig = {}): DynamicRangeResult {
    const startTime = Date.now();

    const {
      gamma = 1.0,
      saturation = 1.0,
      contrast = 1.0,
      exposure = 0,
    } = config;

    let enhanced = image.data.copy();

    // Convert to float
    enhanced = enhanced.astype(numpy.float32) / 255.0;

    // Apply exposure adjustment
    if (exposure !== 0) {
      enhanced = numpy.clip(enhanced * Math.pow(2, exposure), 0, 1);
    }

    // Apply gamma correction
    if (gamma !== 1.0) {
      enhanced = numpy.power(enhanced, 1.0 / gamma);
    }

    // Apply contrast
    if (contrast !== 1.0) {
      enhanced = numpy.clip((enhanced - 0.5) * contrast + 0.5, 0, 1);
    }

    // Apply saturation
    if (saturation !== 1.0 && image.channels >= 3) {
      const hsv = cv2.cvtColor(enhanced, cv2.COLOR_BGR2HSV);
      hsv[:, :, 1] = numpy.clip(hsv[:, :, 1] * saturation, 0, 1);
      enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR);
    }

    // Convert back to uint8
    enhanced = (enhanced * 255).astype(numpy.uint8);

    const dynamicRange = this.calculateDynamicRange(enhanced);
    const contrastRatio = this.calculateContrastRatio(enhanced);

    const processingTime = Date.now() - startTime;
    console.log(`HDR processing: ${processingTime}ms`);

    return {
      enhanced: {
        data: enhanced,
        width: image.width,
        height: image.height,
        channels: image.channels,
        dtype: 'uint8',
      },
      dynamicRange,
      contrastRatio,
    };
  }

  /**
   * Apply tone mapping
   */
  toneMap(image: ImageData, config: ToneMappingConfig = {}): ImageData {
    const startTime = Date.now();

    const {
      gamma = 1.0,
      saturation = 1.0,
      bias = 0.85,
      method = 'drago',
    } = config;

    // Convert to float HDR format
    const hdr = image.data.astype(numpy.float32) / 255.0;

    let toneMapped: any;

    switch (method) {
      case 'drago':
        const dragoTM = cv2.createTonemapDrago({ gamma, saturation, bias });
        toneMapped = dragoTM.process(hdr);
        break;

      case 'reinhard':
        const reinhardTM = cv2.createTonemapReinhard({
          gamma,
          intensity: 0,
          light_adapt: saturation,
          color_adapt: 0,
        });
        toneMapped = reinhardTM.process(hdr);
        break;

      case 'mantiuk':
        const mantiukTM = cv2.createTonemapMantiuk({
          gamma,
          scale: saturation,
          saturation,
        });
        toneMapped = mantiukTM.process(hdr);
        break;
    }

    const result = (toneMapped * 255).astype(numpy.uint8);

    const processingTime = Date.now() - startTime;
    console.log(`Tone mapping (${method}): ${processingTime}ms`);

    return {
      data: result,
      width: image.width,
      height: image.height,
      channels: image.channels,
      dtype: 'uint8',
    };
  }

  /**
   * Enhance low-light images
   */
  enhanceLowLight(image: ImageData, config: LowLightConfig = {}): ImageData {
    const startTime = Date.now();

    const { gamma = 2.2, gain = 1.5, method = 'clahe' } = config;

    let enhanced: any;
    const input = image.data;

    switch (method) {
      case 'clahe':
        enhanced = this.applyCLAHE(input);
        break;

      case 'gamma':
        enhanced = this.applyGammaCorrection(input, gamma);
        break;

      case 'retinex':
        enhanced = this.applyRetinex(input);
        break;
    }

    // Apply gain if needed
    if (gain !== 1.0) {
      enhanced = numpy.clip(enhanced.astype(numpy.float32) * gain, 0, 255).astype(
        numpy.uint8
      );
    }

    const processingTime = Date.now() - startTime;
    console.log(`Low-light enhancement (${method}): ${processingTime}ms`);

    return {
      data: enhanced,
      width: image.width,
      height: image.height,
      channels: image.channels,
      dtype: 'uint8',
    };
  }

  private applyCLAHE(image: any): any {
    if (image.ndim === 3) {
      // Convert to LAB color space
      const lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB);
      const channels = cv2.split(lab);

      // Apply CLAHE to L channel
      const clahe = cv2.createCLAHE({ clipLimit: 3.0, tileGridSize: [8, 8] });
      channels[0] = clahe.apply(channels[0]);

      // Merge and convert back
      const merged = cv2.merge(channels);
      return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR);
    } else {
      const clahe = cv2.createCLAHE({ clipLimit: 3.0, tileGridSize: [8, 8] });
      return clahe.apply(image);
    }
  }

  private applyGammaCorrection(image: any, gamma: number): any {
    const lookupTable = numpy.empty([1, 256], dtype: numpy.uint8);
    for (let i = 0; i < 256; i++) {
      lookupTable[0, i] = numpy.clip(Math.pow(i / 255.0, 1.0 / gamma) * 255.0, 0, 255);
    }
    return cv2.LUT(image, lookupTable);
  }

  private applyRetinex(image: any): any {
    // Single-scale retinex
    const sigma = 15;
    const img = image.astype(numpy.float32);

    if (img.ndim === 3) {
      const result = numpy.zeros_like(img);
      for (let i = 0; i < 3; i++) {
        const channel = img[:, :, i];
        const blurred = cv2.GaussianBlur(channel, [0, 0], sigma);
        result[:, :, i] = numpy.log10(channel + 1) - numpy.log10(blurred + 1);
      }
      return numpy.clip(result * 255, 0, 255).astype(numpy.uint8);
    } else {
      const blurred = cv2.GaussianBlur(img, [0, 0], sigma);
      const result = numpy.log10(img + 1) - numpy.log10(blurred + 1);
      return numpy.clip(result * 255, 0, 255).astype(numpy.uint8);
    }
  }

  /**
   * Apply color grading
   */
  colorGrade(image: ImageData, config: ColorGradingConfig = {}): ImageData {
    const startTime = Date.now();

    const {
      temperature = 0,
      tint = 0,
      vibrance = 0,
      saturation = 0,
    } = config;

    let enhanced = image.data.copy();

    // Apply temperature
    if (temperature !== 0) {
      enhanced = this.adjustTemperature(enhanced, temperature);
    }

    // Apply tint
    if (tint !== 0) {
      enhanced = this.adjustTint(enhanced, tint);
    }

    // Apply vibrance
    if (vibrance !== 0) {
      enhanced = this.adjustVibrance(enhanced, vibrance);
    }

    // Apply saturation
    if (saturation !== 0) {
      enhanced = this.adjustSaturation(enhanced, saturation);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Color grading: ${processingTime}ms`);

    return {
      data: enhanced,
      width: image.width,
      height: image.height,
      channels: image.channels,
      dtype: 'uint8',
    };
  }

  private adjustTemperature(image: any, amount: number): any {
    const adjustment = amount / 100.0;
    const result = image.astype(numpy.float32);

    // Warm (positive) or cool (negative)
    if (adjustment > 0) {
      result[:, :, 2] = numpy.clip(result[:, :, 2] * (1 + adjustment * 0.3), 0, 255);
      result[:, :, 0] = numpy.clip(result[:, :, 0] * (1 - adjustment * 0.2), 0, 255);
    } else {
      result[:, :, 0] = numpy.clip(result[:, :, 0] * (1 - adjustment * 0.3), 0, 255);
      result[:, :, 2] = numpy.clip(result[:, :, 2] * (1 + adjustment * 0.2), 0, 255);
    }

    return result.astype(numpy.uint8);
  }

  private adjustTint(image: any, amount: number): any {
    const adjustment = amount / 100.0;
    const result = image.astype(numpy.float32);

    // Green (positive) or magenta (negative)
    result[:, :, 1] = numpy.clip(result[:, :, 1] * (1 + adjustment * 0.3), 0, 255);

    return result.astype(numpy.uint8);
  }

  private adjustVibrance(image: any, amount: number): any {
    const adjustment = 1 + amount / 100.0;
    const hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(numpy.float32);

    // Increase saturation of less saturated colors
    const mask = hsv[:, :, 1] < 128;
    hsv[:, :, 1][mask] = numpy.clip(hsv[:, :, 1][mask] * adjustment, 0, 255);

    return cv2.cvtColor(hsv.astype(numpy.uint8), cv2.COLOR_HSV2BGR);
  }

  private adjustSaturation(image: any, amount: number): any {
    const adjustment = 1 + amount / 100.0;
    const hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(numpy.float32);

    hsv[:, :, 1] = numpy.clip(hsv[:, :, 1] * adjustment, 0, 255);

    return cv2.cvtColor(hsv.astype(numpy.uint8), cv2.COLOR_HSV2BGR);
  }

  /**
   * Auto-enhance image using multiple techniques
   */
  autoEnhance(image: ImageData): ImageEnhancementResult {
    const startTime = Date.now();

    let enhanced = image.data.copy();

    // Analyze image
    const brightness = this.calculateBrightness(enhanced);
    const contrast = this.calculateContrast(enhanced);
    const sharpness = this.calculateSharpness(enhanced);

    // Apply corrections based on analysis
    if (brightness < 100) {
      // Image is too dark
      enhanced = this.applyCLAHE(enhanced);
    } else if (brightness > 180) {
      // Image is too bright
      enhanced = this.applyGammaCorrection(enhanced, 1.2);
    }

    if (contrast < 40) {
      // Low contrast
      enhanced = this.adjustSaturation(enhanced, 20);
    }

    if (sharpness < 50) {
      // Blurry
      enhanced = this.unsharpMask(enhanced, 0.5, 1.0, 0);
    }

    const processingTime = Date.now() - startTime;

    return {
      enhanced: {
        data: enhanced,
        width: image.width,
        height: image.height,
        channels: image.channels,
        dtype: image.dtype,
      },
      processingTime,
      improvements: {
        brightness: this.calculateBrightness(enhanced) - brightness,
        contrast: this.calculateContrast(enhanced) - contrast,
        sharpness: this.calculateSharpness(enhanced) - sharpness,
      },
    };
  }

  /**
   * Apply basic adjustments
   */
  adjustBasic(image: ImageData, config: EnhancementConfig): ImageData {
    let enhanced = image.data.astype(numpy.float32);

    // Brightness
    if (config.brightness) {
      enhanced = enhanced + config.brightness;
    }

    // Contrast
    if (config.contrast) {
      const factor = (259 * (config.contrast + 255)) / (255 * (259 - config.contrast));
      enhanced = numpy.clip(factor * (enhanced - 128) + 128, 0, 255);
    }

    // Saturation
    if (config.saturation && image.channels >= 3) {
      const hsv = cv2.cvtColor(enhanced.astype(numpy.uint8), cv2.COLOR_BGR2HSV);
      hsv[:, :, 1] = numpy.clip(
        hsv[:, :, 1] * (1 + config.saturation / 100),
        0,
        255
      );
      enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR).astype(numpy.float32);
    }

    // Sharpness
    if (config.sharpness) {
      const uint8Image = numpy.clip(enhanced, 0, 255).astype(numpy.uint8);
      enhanced = this.unsharpMask(uint8Image, config.sharpness, 1.0, 0).astype(
        numpy.float32
      );
    }

    // Denoise
    if (config.denoise) {
      const uint8Image = numpy.clip(enhanced, 0, 255).astype(numpy.uint8);
      enhanced = cv2.fastNlMeansDenoisingColored(
        uint8Image,
        null,
        config.denoiseStrength ?? 10,
        config.denoiseStrength ?? 10,
        7,
        21
      ).astype(numpy.float32);
    }

    return {
      data: numpy.clip(enhanced, 0, 255).astype(numpy.uint8),
      width: image.width,
      height: image.height,
      channels: image.channels,
      dtype: 'uint8',
    };
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  private estimateNoiseLevel(image: any): number {
    // Use Laplacian variance to estimate noise
    const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    return laplacian.var();
  }

  private calculateSharpness(image: any): number {
    // Use Laplacian variance as sharpness measure
    const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    return laplacian.var();
  }

  private calculateBrightness(image: any): number {
    if (image.ndim === 3) {
      const hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV);
      return hsv[:, :, 2].mean();
    }
    return image.mean();
  }

  private calculateContrast(image: any): number {
    const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
    return gray.std();
  }

  private calculateDynamicRange(image: any): number {
    const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
    const min = gray.min();
    const max = gray.max();
    return max - min;
  }

  private calculateContrastRatio(image: any): number {
    const gray = image.ndim === 3 ? cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) : image;
    const histogram = cv2.calcHist([gray], [0], null, [256], [0, 256]);

    // Find 1st and 99th percentile
    const total = gray.size;
    let cumSum = 0;
    let p1 = 0;
    let p99 = 255;

    for (let i = 0; i < 256; i++) {
      cumSum += histogram[i];
      if (cumSum >= total * 0.01 && p1 === 0) {
        p1 = i;
      }
      if (cumSum >= total * 0.99) {
        p99 = i;
        break;
      }
    }

    return p99 / (p1 + 1);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create image enhancer with preset configuration
 */
export function createImageEnhancer(
  preset: 'quality' | 'speed' | 'balanced' = 'balanced',
  customConfig?: ImageEnhancerConfig
): ImageEnhancer {
  let config: ImageEnhancerConfig;

  switch (preset) {
    case 'quality':
      config = {
        defaultScale: 4,
        defaultModel: SuperResolutionModel.EDSR,
        enableGPU: true,
      };
      break;

    case 'speed':
      config = {
        defaultScale: 2,
        defaultModel: SuperResolutionModel.ESPCN,
        enableGPU: false,
      };
      break;

    case 'balanced':
      config = {
        defaultScale: 2,
        defaultModel: SuperResolutionModel.FSRCNN,
        enableGPU: true,
      };
      break;
  }

  return new ImageEnhancer({ ...config, ...customConfig });
}
