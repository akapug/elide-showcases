/**
 * API Routes - Computer Vision Pipeline
 *
 * Route handlers for CV processing endpoints
 *
 * @module api/routes
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { RequestContext, sendJson, sendError } from './server';
import { nanoid } from 'nanoid';

interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  bufferReused: boolean;
  memoryUsed?: number;
}

/**
 * Execute Python CV processor
 */
async function executePythonProcessor(
  scriptPath: string,
  args: string[],
  imageBuffer?: Buffer,
  timeout: number = 30000
): Promise<ProcessingResult> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python3';
    const proc = spawn(pythonPath, [scriptPath, ...args], {
      cwd: join(__dirname, '..'),
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    // Send image buffer via stdin if provided
    if (imageBuffer) {
      proc.stdin.write(imageBuffer);
      proc.stdin.end();
    }

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutHandle = setTimeout(() => {
      proc.kill();
      reject(new Error('Processing timeout'));
    }, timeout);

    proc.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const processingTime = Date.now() - startTime;

      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve({
            success: true,
            data: result,
            processingTime,
            bufferReused: result.bufferReused || false,
            memoryUsed: result.memoryUsed,
          });
        } catch (error) {
          reject(new Error(`Failed to parse result: ${error}`));
        }
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeoutHandle);
      reject(error);
    });
  });
}

/**
 * Route handler
 */
class Router {
  /**
   * Handle incoming request
   */
  async handle(ctx: RequestContext, metrics: any): Promise<boolean> {
    const { path, method } = ctx;

    // Face detection
    if (path === '/api/v1/process/detect-faces' && method === 'POST') {
      return this.handleFaceDetection(ctx, metrics);
    }

    // Object tracking
    if (path === '/api/v1/process/track-objects' && method === 'POST') {
      return this.handleObjectTracking(ctx, metrics);
    }

    // Apply filter
    if (path === '/api/v1/process/apply-filter' && method === 'POST') {
      return this.handleApplyFilter(ctx, metrics);
    }

    // Transform image
    if (path === '/api/v1/process/transform' && method === 'POST') {
      return this.handleTransform(ctx, metrics);
    }

    // Video processing
    if (path === '/api/v1/video/process' && method === 'POST') {
      return this.handleVideoProcessing(ctx, metrics);
    }

    // Batch processing
    if (path === '/api/v1/process/batch' && method === 'POST') {
      return this.handleBatchProcessing(ctx, metrics);
    }

    // Get capabilities
    if (path === '/api/v1/capabilities' && method === 'GET') {
      return this.handleCapabilities(ctx);
    }

    // Get processing history
    if (path === '/api/v1/history' && method === 'GET') {
      return this.handleHistory(ctx);
    }

    return false;
  }

  /**
   * Handle face detection
   */
  private async handleFaceDetection(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const { imageBuffer, format, originalSize } = ctx.body;

      if (!imageBuffer) {
        sendError(ctx.res, 400, 'Missing image data');
        return true;
      }

      const buffer = Buffer.from(imageBuffer, 'base64');
      const scriptPath = join(__dirname, '../cv/opencv_processor.py');
      const args = ['detect-faces', format || 'jpeg'];

      const result = await executePythonProcessor(scriptPath, args, buffer);

      metrics.imagesProcessed++;
      metrics.totalProcessingTime += result.processingTime;

      if (result.data.bufferReused) {
        metrics.bufferPoolHits++;
      } else {
        metrics.bufferPoolMisses++;
      }

      sendJson(ctx.res, 200, {
        success: true,
        operation: 'face-detection',
        faces: result.data.faces,
        totalFaces: result.data.totalFaces,
        imageSize: {
          width: result.data.width,
          height: result.data.height,
        },
        performance: {
          processingTime: result.processingTime,
          bufferReused: result.bufferReused,
          memoryUsed: result.memoryUsed,
          fps: result.data.fps,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Face detection error:', error);
      sendError(ctx.res, 500, 'Face detection failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle object tracking
   */
  private async handleObjectTracking(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const { imageBuffer, format, trackingType = 'all' } = ctx.body;

      if (!imageBuffer) {
        sendError(ctx.res, 400, 'Missing image data');
        return true;
      }

      const buffer = Buffer.from(imageBuffer, 'base64');
      const scriptPath = join(__dirname, '../cv/opencv_processor.py');
      const args = ['track-objects', format || 'jpeg', trackingType];

      const result = await executePythonProcessor(scriptPath, args, buffer);

      metrics.imagesProcessed++;
      metrics.totalProcessingTime += result.processingTime;

      sendJson(ctx.res, 200, {
        success: true,
        operation: 'object-tracking',
        objects: result.data.objects,
        totalObjects: result.data.totalObjects,
        imageSize: {
          width: result.data.width,
          height: result.data.height,
        },
        performance: {
          processingTime: result.processingTime,
          bufferReused: result.bufferReused,
          memoryUsed: result.memoryUsed,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Object tracking error:', error);
      sendError(ctx.res, 500, 'Object tracking failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle apply filter
   */
  private async handleApplyFilter(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const { imageBuffer, format, filter, intensity = 1.0 } = ctx.body;

      if (!imageBuffer) {
        sendError(ctx.res, 400, 'Missing image data');
        return true;
      }

      if (!filter) {
        sendError(ctx.res, 400, 'Missing filter type');
        return true;
      }

      const buffer = Buffer.from(imageBuffer, 'base64');
      const scriptPath = join(__dirname, '../cv/pillow_processor.py');
      const args = ['filter', format || 'jpeg', filter, intensity.toString()];

      const result = await executePythonProcessor(scriptPath, args, buffer);

      metrics.imagesProcessed++;
      metrics.totalProcessingTime += result.processingTime;

      sendJson(ctx.res, 200, {
        success: true,
        operation: 'apply-filter',
        filter: filter,
        intensity: intensity,
        outputImage: result.data.imageData,
        imageSize: {
          width: result.data.width,
          height: result.data.height,
        },
        performance: {
          processingTime: result.processingTime,
          bufferReused: result.bufferReused,
          memoryUsed: result.memoryUsed,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Filter application error:', error);
      sendError(ctx.res, 500, 'Filter application failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle transform
   */
  private async handleTransform(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const {
        imageBuffer,
        format,
        operation,
        width,
        height,
        angle,
        cropBox,
      } = ctx.body;

      if (!imageBuffer) {
        sendError(ctx.res, 400, 'Missing image data');
        return true;
      }

      if (!operation) {
        sendError(ctx.res, 400, 'Missing operation type');
        return true;
      }

      const buffer = Buffer.from(imageBuffer, 'base64');
      const scriptPath = join(__dirname, '../cv/pillow_processor.py');

      let args: string[];
      if (operation === 'resize') {
        args = ['resize', format || 'jpeg', width?.toString() || '800', height?.toString() || '600'];
      } else if (operation === 'rotate') {
        args = ['rotate', format || 'jpeg', angle?.toString() || '90'];
      } else if (operation === 'crop') {
        const box = cropBox || { x: 0, y: 0, width: 100, height: 100 };
        args = ['crop', format || 'jpeg', box.x.toString(), box.y.toString(), box.width.toString(), box.height.toString()];
      } else {
        sendError(ctx.res, 400, 'Invalid operation type');
        return true;
      }

      const result = await executePythonProcessor(scriptPath, args, buffer);

      metrics.imagesProcessed++;
      metrics.totalProcessingTime += result.processingTime;

      sendJson(ctx.res, 200, {
        success: true,
        operation: operation,
        outputImage: result.data.imageData,
        imageSize: {
          width: result.data.width,
          height: result.data.height,
        },
        performance: {
          processingTime: result.processingTime,
          bufferReused: result.bufferReused,
          memoryUsed: result.memoryUsed,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Transform error:', error);
      sendError(ctx.res, 500, 'Transform failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle video processing
   */
  private async handleVideoProcessing(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const { videoBuffer, format, operation, targetFps = 30 } = ctx.body;

      if (!videoBuffer) {
        sendError(ctx.res, 400, 'Missing video data');
        return true;
      }

      const buffer = Buffer.from(videoBuffer, 'base64');
      const scriptPath = join(__dirname, '../cv/opencv_processor.py');
      const args = ['process-video', format || 'mp4', operation || 'detect-faces', targetFps.toString()];

      const result = await executePythonProcessor(scriptPath, args, buffer, 60000); // 60s timeout for video

      metrics.videoFramesProcessed += result.data.framesProcessed || 0;
      metrics.totalProcessingTime += result.processingTime;

      sendJson(ctx.res, 200, {
        success: true,
        operation: 'video-processing',
        framesProcessed: result.data.framesProcessed,
        fps: result.data.fps,
        duration: result.data.duration,
        results: result.data.results,
        performance: {
          processingTime: result.processingTime,
          avgFrameTime: result.data.avgFrameTime,
          memoryUsed: result.memoryUsed,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Video processing error:', error);
      sendError(ctx.res, 500, 'Video processing failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle batch processing
   */
  private async handleBatchProcessing(ctx: RequestContext, metrics: any): Promise<boolean> {
    try {
      const { images, operation, options = {} } = ctx.body;

      if (!images || !Array.isArray(images)) {
        sendError(ctx.res, 400, 'Missing or invalid images array');
        return true;
      }

      const batchId = nanoid();
      const results = [];
      let totalTime = 0;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const buffer = Buffer.from(image.data, 'base64');

        let scriptPath: string;
        let args: string[];

        if (operation === 'detect-faces') {
          scriptPath = join(__dirname, '../cv/opencv_processor.py');
          args = ['detect-faces', image.format || 'jpeg'];
        } else if (operation === 'apply-filter') {
          scriptPath = join(__dirname, '../cv/pillow_processor.py');
          args = ['filter', image.format || 'jpeg', options.filter || 'blur', options.intensity?.toString() || '1.0'];
        } else {
          sendError(ctx.res, 400, 'Invalid operation for batch processing');
          return true;
        }

        try {
          const result = await executePythonProcessor(scriptPath, args, buffer);
          results.push({
            index: i,
            success: true,
            data: result.data,
            processingTime: result.processingTime,
          });
          totalTime += result.processingTime;
          metrics.imagesProcessed++;
        } catch (error) {
          results.push({
            index: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      metrics.totalProcessingTime += totalTime;

      sendJson(ctx.res, 200, {
        success: true,
        batchId: batchId,
        operation: operation,
        totalImages: images.length,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results,
        performance: {
          totalTime: totalTime,
          avgTimePerImage: totalTime / images.length,
        },
        requestId: ctx.requestId,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Batch processing error:', error);
      sendError(ctx.res, 500, 'Batch processing failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle capabilities
   */
  private async handleCapabilities(ctx: RequestContext): Promise<boolean> {
    const capabilities = {
      version: '1.0.0',
      features: {
        faceDetection: {
          enabled: true,
          models: ['haarcascade', 'dnn'],
          maxFaces: 100,
        },
        objectTracking: {
          enabled: true,
          trackers: ['CSRT', 'KCF', 'MOSSE'],
          maxObjects: 50,
        },
        filters: {
          enabled: true,
          available: ['blur', 'sharpen', 'edge-enhance', 'smooth', 'emboss', 'contour'],
        },
        transforms: {
          enabled: true,
          operations: ['resize', 'rotate', 'crop', 'flip'],
        },
        videoProcessing: {
          enabled: true,
          maxFps: 60,
          targetFps: 30,
          maxDuration: 60,
        },
      },
      limits: {
        maxImageSize: 10 * 1024 * 1024, // 10MB
        maxVideoSize: 100 * 1024 * 1024, // 100MB
        maxBatchSize: 50,
        maxConcurrentRequests: 10,
      },
      performance: {
        bufferPool: {
          enabled: true,
          zeroCopy: true,
          maxBuffers: 100,
        },
        expectedLatency: {
          faceDetection: '50-150ms',
          objectTracking: '100-300ms',
          filterApplication: '30-100ms',
          videoFrame: '30-50ms',
        },
      },
    };

    sendJson(ctx.res, 200, capabilities);
    return true;
  }

  /**
   * Handle history
   */
  private async handleHistory(ctx: RequestContext): Promise<boolean> {
    // Mock history - in production, store in database
    const history = {
      recentProcessing: [
        {
          id: 'proc_001',
          operation: 'face-detection',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          processingTime: 87,
          success: true,
        },
        {
          id: 'proc_002',
          operation: 'apply-filter',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          processingTime: 45,
          success: true,
        },
      ],
      totalProcessed: 1247,
      avgProcessingTime: 92,
    };

    sendJson(ctx.res, 200, history);
    return true;
  }
}

export const router = new Router();
