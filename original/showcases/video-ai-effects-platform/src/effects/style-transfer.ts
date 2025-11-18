/**
 * Neural Style Transfer Module
 *
 * Real-time artistic style transfer using neural networks.
 * Supports multiple style presets and custom style images.
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

/**
 * Frame data structure
 */
interface FrameData {
  data: Buffer;
  width: number;
  height: number;
  timestamp: number;
  format: string;
  metadata?: Record<string, any>;
}

/**
 * Style transfer configuration
 */
interface StyleTransferConfig {
  modelPath?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  stylePresets?: string[];
  enableCache?: boolean;
  backend?: 'cpu' | 'cuda';
}

/**
 * Style parameters
 */
interface StyleParams {
  strength?: number;
  preserveColor?: boolean;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay';
  contentWeight?: number;
  styleWeight?: number;
}

/**
 * Style preset definition
 */
interface StylePreset {
  name: string;
  displayName: string;
  description: string;
  defaultStrength: number;
  defaultParams: StyleParams;
}

/**
 * Style transfer class
 */
export class StyleTransfer extends EventEmitter {
  private config: StyleTransferConfig;
  private pythonProcess: ChildProcess | null = null;
  private isInitialized: boolean = false;
  private styleCache: Map<string, Buffer> = new Map();
  private processingQueue: Array<{
    frame: FrameData;
    style: string;
    params: StyleParams;
    resolve: (result: FrameData) => void;
    reject: (error: Error) => void;
  }> = [];
  private presets: Map<string, StylePreset>;

  constructor(config: StyleTransferConfig = {}) {
    super();

    this.config = {
      modelPath: './models/style_transfer',
      quality: 'high',
      stylePresets: [
        'starry-night',
        'mosaic',
        'candy',
        'udnie',
        'rain-princess',
        'scream',
        'wave',
        'la-muse'
      ],
      enableCache: true,
      backend: 'cpu',
      ...config
    };

    this.presets = new Map();
    this.initializePresets();
  }

  /**
   * Initialize style presets
   */
  private initializePresets(): void {
    const presetDefinitions: StylePreset[] = [
      {
        name: 'starry-night',
        displayName: 'Starry Night',
        description: 'Van Gogh\'s iconic swirling night sky',
        defaultStrength: 0.8,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 100000,
          preserveColor: false
        }
      },
      {
        name: 'mosaic',
        displayName: 'Mosaic',
        description: 'Colorful mosaic tile pattern',
        defaultStrength: 0.7,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 80000,
          preserveColor: false
        }
      },
      {
        name: 'candy',
        displayName: 'Candy',
        description: 'Bright, colorful candy-like style',
        defaultStrength: 0.9,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 120000,
          preserveColor: false
        }
      },
      {
        name: 'udnie',
        displayName: 'Udnie',
        description: 'Francis Picabia\'s abstract composition',
        defaultStrength: 0.8,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 100000,
          preserveColor: false
        }
      },
      {
        name: 'rain-princess',
        displayName: 'Rain Princess',
        description: 'Leonid Afremov\'s colorful rain scene',
        defaultStrength: 0.75,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 90000,
          preserveColor: false
        }
      },
      {
        name: 'scream',
        displayName: 'The Scream',
        description: 'Edvard Munch\'s expressionist masterpiece',
        defaultStrength: 0.85,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 110000,
          preserveColor: false
        }
      },
      {
        name: 'wave',
        displayName: 'Great Wave',
        description: 'Hokusai\'s iconic wave',
        defaultStrength: 0.8,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 100000,
          preserveColor: false
        }
      },
      {
        name: 'la-muse',
        displayName: 'La Muse',
        description: 'Picasso\'s abstract portrait style',
        defaultStrength: 0.7,
        defaultParams: {
          contentWeight: 1.0,
          styleWeight: 85000,
          preserveColor: false
        }
      }
    ];

    for (const preset of presetDefinitions) {
      this.presets.set(preset.name, preset);
    }
  }

  /**
   * Initialize style transfer
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing style transfer...');

    try {
      await this.initializePythonBackend();
      this.isInitialized = true;
      console.log('Style transfer initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize style transfer:', error);
      throw error;
    }
  }

  /**
   * Initialize Python backend for neural networks
   */
  private async initializePythonBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../../python/style_transfer.py');

      this.pythonProcess = spawn('python3', [
        pythonScript,
        '--model-path', this.config.modelPath || './models/style_transfer',
        '--backend', this.config.backend || 'cpu',
        '--quality', this.config.quality || 'high'
      ]);

      this.pythonProcess.stdout?.on('data', (data) => {
        const message = data.toString().trim();

        if (message === 'READY') {
          resolve();
        } else {
          this.handlePythonMessage(message);
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('Python error:', data.toString());
      });

      this.pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
        this.pythonProcess = null;
        this.isInitialized = false;
      });

      setTimeout(() => {
        if (!this.isInitialized) {
          reject(new Error('Style transfer initialization timeout'));
        }
      }, 30000); // 30 second timeout for model loading
    });
  }

  /**
   * Handle messages from Python backend
   */
  private handlePythonMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'style-transferred':
          this.handleStyleTransferred(data);
          break;
        case 'progress':
          this.emit('progress', data.progress);
          break;
        case 'error':
          console.error('Python error:', data.message);
          break;
        default:
          console.log('Python:', message);
      }
    } catch (error) {
      console.log('Python:', message);
    }
  }

  /**
   * Handle style transferred result
   */
  private handleStyleTransferred(data: any): void {
    if (this.processingQueue.length > 0) {
      const request = this.processingQueue.shift()!;

      const result: FrameData = {
        ...request.frame,
        data: Buffer.from(data.frame, 'base64'),
        metadata: {
          ...request.frame.metadata,
          style: request.style,
          styleParams: request.params
        }
      };

      request.resolve(result);
      this.emit('transfer-complete', result);
    }
  }

  /**
   * Apply style transfer to frame
   */
  async apply(frame: FrameData, params: any): Promise<FrameData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const style = params.style || 'starry-night';
    const styleParams: StyleParams = {
      strength: params.strength || 0.8,
      preserveColor: params.preserveColor || false,
      blendMode: params.blendMode || 'normal',
      ...this.getPresetParams(style)
    };

    // Check cache
    const cacheKey = this.getCacheKey(frame, style, styleParams);
    if (this.config.enableCache && this.styleCache.has(cacheKey)) {
      const cachedData = this.styleCache.get(cacheKey)!;
      return {
        ...frame,
        data: cachedData,
        metadata: { ...frame.metadata, style, cached: true }
      };
    }

    // Process with neural network
    const result = await this.processStyleTransfer(frame, style, styleParams);

    // Cache result
    if (this.config.enableCache) {
      this.styleCache.set(cacheKey, result.data);

      // Limit cache size
      if (this.styleCache.size > 100) {
        const firstKey = this.styleCache.keys().next().value;
        this.styleCache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Get preset parameters
   */
  private getPresetParams(style: string): Partial<StyleParams> {
    const preset = this.presets.get(style);
    return preset ? preset.defaultParams : {};
  }

  /**
   * Generate cache key
   */
  private getCacheKey(frame: FrameData, style: string, params: StyleParams): string {
    return `${style}_${params.strength}_${params.preserveColor}_${frame.timestamp}`;
  }

  /**
   * Process style transfer
   */
  private async processStyleTransfer(
    frame: FrameData,
    style: string,
    params: StyleParams
  ): Promise<FrameData> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Style transfer not initialized'));
        return;
      }

      this.processingQueue.push({ frame, style, params, resolve, reject });

      const request = {
        type: 'apply-style',
        frame: {
          data: frame.data.toString('base64'),
          width: frame.width,
          height: frame.height
        },
        style,
        params
      };

      this.pythonProcess.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout
      setTimeout(() => {
        const index = this.processingQueue.findIndex(
          req => req.frame === frame && req.style === style
        );

        if (index >= 0) {
          this.processingQueue.splice(index, 1);
          reject(new Error('Style transfer timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Apply fast style transfer (optimized for real-time)
   */
  async applyFast(frame: FrameData, style: string, strength: number = 0.8): Promise<FrameData> {
    // Use simplified algorithm for real-time performance
    const data = Buffer.from(frame.data);

    // Get style color palette
    const palette = this.getStylePalette(style);

    // Apply color mapping
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Map to style palette
      const mapped = this.mapToStylePalette(r, g, b, palette);

      // Blend with original
      data[i] = r * (1 - strength) + mapped.r * strength;
      data[i + 1] = g * (1 - strength) + mapped.g * strength;
      data[i + 2] = b * (1 - strength) + mapped.b * strength;
    }

    return { ...frame, data };
  }

  /**
   * Get style color palette
   */
  private getStylePalette(style: string): number[][] {
    const palettes: Record<string, number[][]> = {
      'starry-night': [
        [0, 30, 70],
        [30, 60, 120],
        [100, 130, 180],
        [200, 180, 100],
        [240, 200, 60]
      ],
      'mosaic': [
        [255, 50, 50],
        [50, 255, 50],
        [50, 50, 255],
        [255, 255, 50],
        [255, 50, 255],
        [50, 255, 255]
      ],
      'candy': [
        [255, 100, 150],
        [150, 100, 255],
        [100, 255, 200],
        [255, 200, 100],
        [200, 150, 255]
      ]
    };

    return palettes[style] || palettes['starry-night'];
  }

  /**
   * Map color to style palette
   */
  private mapToStylePalette(r: number, g: number, b: number, palette: number[][]): { r: number; g: number; b: number } {
    let minDist = Infinity;
    let closest = palette[0];

    for (const color of palette) {
      const dist = Math.sqrt(
        Math.pow(r - color[0], 2) +
        Math.pow(g - color[1], 2) +
        Math.pow(b - color[2], 2)
      );

      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }

    return { r: closest[0], g: closest[1], b: closest[2] };
  }

  /**
   * Preserve original colors while applying style
   */
  async preserveColors(
    original: FrameData,
    styled: FrameData,
    amount: number = 0.5
  ): Promise<FrameData> {
    const result = Buffer.alloc(original.data.length);

    for (let i = 0; i < original.data.length; i += 4) {
      // Convert to HSV
      const originalHSV = this.rgbToHsv(
        original.data[i],
        original.data[i + 1],
        original.data[i + 2]
      );

      const styledHSV = this.rgbToHsv(
        styled.data[i],
        styled.data[i + 1],
        styled.data[i + 2]
      );

      // Preserve hue and saturation, use styled value
      const preservedHSV = {
        h: originalHSV.h * amount + styledHSV.h * (1 - amount),
        s: originalHSV.s * amount + styledHSV.s * (1 - amount),
        v: styledHSV.v
      };

      // Convert back to RGB
      const rgb = this.hsvToRgb(preservedHSV.h, preservedHSV.s, preservedHSV.v);

      result[i] = rgb.r;
      result[i + 1] = rgb.g;
      result[i + 2] = rgb.b;
      result[i + 3] = original.data[i + 3];
    }

    return { ...original, data: result };
  }

  /**
   * Blend styled image with original
   */
  async blend(
    original: FrameData,
    styled: FrameData,
    mode: 'normal' | 'multiply' | 'screen' | 'overlay',
    opacity: number = 0.8
  ): Promise<FrameData> {
    const result = Buffer.alloc(original.data.length);

    for (let i = 0; i < original.data.length; i += 4) {
      let r: number, g: number, b: number;

      switch (mode) {
        case 'multiply':
          r = (original.data[i] * styled.data[i]) / 255;
          g = (original.data[i + 1] * styled.data[i + 1]) / 255;
          b = (original.data[i + 2] * styled.data[i + 2]) / 255;
          break;

        case 'screen':
          r = 255 - ((255 - original.data[i]) * (255 - styled.data[i])) / 255;
          g = 255 - ((255 - original.data[i + 1]) * (255 - styled.data[i + 1])) / 255;
          b = 255 - ((255 - original.data[i + 2]) * (255 - styled.data[i + 2])) / 255;
          break;

        case 'overlay':
          r = this.overlayBlend(original.data[i], styled.data[i]);
          g = this.overlayBlend(original.data[i + 1], styled.data[i + 1]);
          b = this.overlayBlend(original.data[i + 2], styled.data[i + 2]);
          break;

        default: // normal
          r = styled.data[i];
          g = styled.data[i + 1];
          b = styled.data[i + 2];
      }

      // Apply opacity
      result[i] = original.data[i] * (1 - opacity) + r * opacity;
      result[i + 1] = original.data[i + 1] * (1 - opacity) + g * opacity;
      result[i + 2] = original.data[i + 2] * (1 - opacity) + b * opacity;
      result[i + 3] = original.data[i + 3];
    }

    return { ...original, data: result };
  }

  /**
   * Overlay blend mode
   */
  private overlayBlend(base: number, overlay: number): number {
    if (base < 128) {
      return (2 * base * overlay) / 255;
    } else {
      return 255 - (2 * (255 - base) * (255 - overlay)) / 255;
    }
  }

  /**
   * Convert RGB to HSV
   */
  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = max === 0 ? 0 : delta / max;
    let v = max;

    if (delta !== 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return { h, s, v };
  }

  /**
   * Convert HSV to RGB
   */
  private hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  /**
   * Get available style presets
   */
  getPresets(): StylePreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get preset by name
   */
  getPreset(name: string): StylePreset | undefined {
    return this.presets.get(name);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.styleCache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.styleCache.size,
      maxSize: 100
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }

    this.styleCache.clear();
    this.processingQueue = [];
    this.isInitialized = false;
  }
}
