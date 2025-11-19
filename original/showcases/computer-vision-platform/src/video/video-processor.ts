/**
 * Video Processor Module for Computer Vision Platform
 *
 * Demonstrates Elide's polyglot capabilities by using Python's OpenCV (cv2)
 * library seamlessly within TypeScript for advanced video processing.
 *
 * Features:
 * - Video file processing with multiple codecs
 * - Real-time webcam processing
 * - Frame extraction and manipulation
 * - Video encoding and decoding
 * - Batch processing with progress tracking
 * - Performance optimization (frame skipping, resizing, threading)
 */

// @ts-ignore - Elide polyglot import: cv2 for video processing
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import: numpy for array operations
import numpy from 'python:numpy';
// @ts-ignore - Elide polyglot import: time for timing operations
import time from 'python:time';

import { FaceDetector } from '../recognition/face-detector';
import { FaceTracker, TrackedFace } from '../recognition/face-tracker';
import { FaceDatabase } from '../recognition/face-database';

/**
 * Video source types
 */
export type VideoSource = string | number; // File path or camera index

/**
 * Video codec types
 */
export type VideoCodec = 'mp4v' | 'xvid' | 'h264' | 'mjpeg' | 'vp80' | 'vp90';

/**
 * Video processing configuration
 */
export interface VideoProcessorConfig {
  frameSkip: number; // Process every N frames
  maxFrames?: number; // Maximum frames to process
  resize?: {
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  outputPath?: string;
  outputCodec?: VideoCodec;
  outputFps?: number;
  enableDisplay?: boolean;
  displayWindowName?: string;
  processingThreads?: number;
  bufferSize?: number;
}

/**
 * Video metadata
 */
export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  duration: number;
  codec: string;
  format: string;
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  framesProcessed: number;
  framesSkipped: number;
  processingTime: number;
  averageFps: number;
  detectedFaces: number;
  trackedFaces: number;
}

/**
 * Frame processing callback
 */
export type FrameCallback = (
  frame: any,
  frameNumber: number,
  metadata: VideoMetadata
) => any | Promise<any>;

/**
 * Default processor configuration
 */
const DEFAULT_CONFIG: VideoProcessorConfig = {
  frameSkip: 1,
  enableDisplay: false,
  displayWindowName: 'Video Processor',
  processingThreads: 4,
  bufferSize: 10,
};

/**
 * Video Processor class using OpenCV
 *
 * Showcases Elide's ability to use Python's cv2 library directly in TypeScript
 */
export class VideoProcessor {
  private config: VideoProcessorConfig;
  private capture: any; // cv2.VideoCapture
  private writer: any; // cv2.VideoWriter
  private metadata: VideoMetadata | null = null;
  private isProcessing: boolean = false;
  private stats: ProcessingStats;

  constructor(config?: Partial<VideoProcessorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initStats();

    console.log('Video processor initialized with config:', this.config);
  }

  /**
   * Initialize processing statistics
   */
  private initStats(): ProcessingStats {
    return {
      framesProcessed: 0,
      framesSkipped: 0,
      processingTime: 0,
      averageFps: 0,
      detectedFaces: 0,
      trackedFaces: 0,
    };
  }

  /**
   * Open video source (file or camera)
   *
   * @param source - Video file path or camera index
   * @returns True if opened successfully
   */
  public open(source: VideoSource): boolean {
    try {
      // Close existing capture if any
      if (this.capture) {
        this.capture.release();
      }

      // Open video capture
      this.capture = cv2.VideoCapture(source);

      if (!this.capture.isOpened()) {
        throw new Error('Failed to open video source');
      }

      // Extract metadata
      this.metadata = this.extractMetadata();

      console.log('Video source opened:', source);
      console.log('Metadata:', this.metadata);

      return true;
    } catch (error) {
      console.error('Failed to open video source:', error);
      return false;
    }
  }

  /**
   * Extract video metadata
   */
  private extractMetadata(): VideoMetadata {
    const width = this.capture.get(cv2.CAP_PROP_FRAME_WIDTH);
    const height = this.capture.get(cv2.CAP_PROP_FRAME_HEIGHT);
    const fps = this.capture.get(cv2.CAP_PROP_FPS);
    const totalFrames = this.capture.get(cv2.CAP_PROP_FRAME_COUNT);
    const fourcc = this.capture.get(cv2.CAP_PROP_FOURCC);

    return {
      width: Math.floor(width),
      height: Math.floor(height),
      fps: fps || 30,
      totalFrames: Math.floor(totalFrames),
      duration: totalFrames > 0 ? totalFrames / fps : 0,
      codec: this.fourccToString(fourcc),
      format: typeof this.capture === 'string' ? 'file' : 'camera',
    };
  }

  /**
   * Convert FOURCC code to string
   */
  private fourccToString(fourcc: number): string {
    const bytes = [
      fourcc & 0xff,
      (fourcc >> 8) & 0xff,
      (fourcc >> 16) & 0xff,
      (fourcc >> 24) & 0xff,
    ];

    return String.fromCharCode(...bytes);
  }

  /**
   * Process video file with custom callback
   *
   * @param source - Video file path
   * @param callback - Frame processing callback
   * @param config - Processing configuration
   * @returns Processing statistics
   */
  public async processVideo(
    source: string,
    callback: FrameCallback,
    config?: Partial<VideoProcessorConfig>
  ): Promise<ProcessingStats> {
    // Merge configuration
    const procConfig = { ...this.config, ...config };

    // Open video
    if (!this.open(source)) {
      throw new Error('Failed to open video file');
    }

    // Initialize output writer if needed
    if (procConfig.outputPath) {
      this.initWriter(procConfig);
    }

    // Reset statistics
    this.stats = this.initStats();
    this.isProcessing = true;

    const startTime = time.time();
    let frameNumber = 0;

    try {
      while (this.isProcessing) {
        // Read frame
        const [success, frame] = this.capture.read();

        if (!success) {
          console.log('End of video reached');
          break;
        }

        frameNumber++;

        // Check max frames limit
        if (procConfig.maxFrames && frameNumber > procConfig.maxFrames) {
          console.log('Max frames limit reached');
          break;
        }

        // Frame skipping
        if (frameNumber % procConfig.frameSkip !== 0) {
          this.stats.framesSkipped++;
          continue;
        }

        // Resize frame if needed
        let processedFrame = frame;
        if (procConfig.resize) {
          processedFrame = this.resizeFrame(frame, procConfig.resize);
        }

        // Process frame with callback
        const result = await callback(processedFrame, frameNumber, this.metadata!);

        // Use result as output frame if provided
        const outputFrame = result || processedFrame;

        // Write to output if writer is initialized
        if (this.writer) {
          this.writer.write(outputFrame);
        }

        // Display frame if enabled
        if (procConfig.enableDisplay) {
          cv2.imshow(procConfig.displayWindowName!, outputFrame);

          // Break on 'q' key
          const key = cv2.waitKey(1) & 0xff;
          if (key === 113) { // 'q' key
            console.log('Processing interrupted by user');
            break;
          }
        }

        this.stats.framesProcessed++;

        // Log progress periodically
        if (frameNumber % 100 === 0) {
          const elapsed = time.time() - startTime;
          const fps = frameNumber / elapsed;
          console.log(
            `Processed ${frameNumber} frames (${fps.toFixed(1)} FPS)`
          );
        }
      }

      // Calculate final statistics
      const totalTime = time.time() - startTime;
      this.stats.processingTime = totalTime;
      this.stats.averageFps = frameNumber / totalTime;

      console.log('Processing complete:', this.stats);

      return this.stats;
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Process webcam stream in real-time
   *
   * @param cameraIndex - Camera index (default: 0)
   * @param callback - Frame processing callback
   * @param config - Processing configuration
   */
  public async processWebcam(
    cameraIndex: number = 0,
    callback: FrameCallback,
    config?: Partial<VideoProcessorConfig>
  ): Promise<void> {
    // Merge configuration
    const procConfig = {
      ...this.config,
      ...config,
      enableDisplay: true, // Always enable display for webcam
    };

    // Open webcam
    if (!this.open(cameraIndex)) {
      throw new Error('Failed to open webcam');
    }

    console.log('Webcam processing started. Press "q" to quit.');

    // Reset statistics
    this.stats = this.initStats();
    this.isProcessing = true;

    const startTime = time.time();
    let frameNumber = 0;

    try {
      while (this.isProcessing) {
        // Read frame
        const [success, frame] = this.capture.read();

        if (!success) {
          console.error('Failed to read from webcam');
          break;
        }

        frameNumber++;

        // Frame skipping
        if (frameNumber % procConfig.frameSkip !== 0) {
          this.stats.framesSkipped++;
          continue;
        }

        // Resize frame if needed
        let processedFrame = frame;
        if (procConfig.resize) {
          processedFrame = this.resizeFrame(frame, procConfig.resize);
        }

        // Process frame with callback
        const result = await callback(processedFrame, frameNumber, this.metadata!);

        // Use result as output frame if provided
        const outputFrame = result || processedFrame;

        // Display frame
        cv2.imshow(procConfig.displayWindowName!, outputFrame);

        // Check for quit key
        const key = cv2.waitKey(1) & 0xff;
        if (key === 113) { // 'q' key
          console.log('Webcam processing stopped by user');
          break;
        }

        this.stats.framesProcessed++;

        // Update FPS display every 30 frames
        if (frameNumber % 30 === 0) {
          const elapsed = time.time() - startTime;
          this.stats.averageFps = frameNumber / elapsed;
        }
      }
    } catch (error) {
      console.error('Webcam processing error:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Process video with face detection
   *
   * @param source - Video source
   * @param detector - Face detector instance
   * @param config - Processing configuration
   * @returns Processing statistics
   */
  public async processVideoWithDetection(
    source: VideoSource,
    detector: FaceDetector,
    config?: Partial<VideoProcessorConfig>
  ): Promise<ProcessingStats> {
    const callback: FrameCallback = (frame, frameNumber, metadata) => {
      // Detect faces
      const detections = detector.detect(frame, {
        includeConfidence: true,
      });

      this.stats.detectedFaces += detections.length;

      // Draw detections
      const annotatedFrame = this.drawDetections(frame, detections);

      return annotatedFrame;
    };

    if (typeof source === 'string') {
      return await this.processVideo(source, callback, config);
    } else {
      await this.processWebcam(source, callback, config);
      return this.stats;
    }
  }

  /**
   * Process video with face tracking
   *
   * @param source - Video source
   * @param tracker - Face tracker instance
   * @param config - Processing configuration
   * @returns Processing statistics
   */
  public async processVideoWithTracking(
    source: VideoSource,
    tracker: FaceTracker,
    config?: Partial<VideoProcessorConfig>
  ): Promise<ProcessingStats> {
    const callback: FrameCallback = (frame, frameNumber, metadata) => {
      // Process frame with tracker
      const trackedFaces = tracker.processFrame(frame);

      this.stats.trackedFaces = trackedFaces.length;

      // Draw tracked faces
      const annotatedFrame = tracker.drawTrackedFaces(frame, {
        drawBox: true,
        drawLabel: true,
        drawConfidence: true,
      });

      return annotatedFrame;
    };

    if (typeof source === 'string') {
      return await this.processVideo(source, callback, config);
    } else {
      await this.processWebcam(source, callback, config);
      return this.stats;
    }
  }

  /**
   * Draw face detections on frame
   */
  private drawDetections(frame: any, detections: any[]): any {
    const annotatedFrame = frame.copy();

    for (const detection of detections) {
      const { box, confidence } = detection;

      // Draw bounding box
      cv2.rectangle(
        annotatedFrame,
        [box.left, box.top],
        [box.right, box.bottom],
        [0, 255, 0],
        2
      );

      // Draw confidence
      const label = `${(confidence * 100).toFixed(1)}%`;
      cv2.putText(
        annotatedFrame,
        label,
        [box.left, box.top - 10],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        [0, 255, 0],
        2
      );
    }

    return annotatedFrame;
  }

  /**
   * Initialize video writer for output
   */
  private initWriter(config: VideoProcessorConfig): void {
    if (!this.metadata || !config.outputPath) {
      return;
    }

    try {
      // Get codec FOURCC code
      const codec = config.outputCodec || 'mp4v';
      const fourcc = cv2.VideoWriter_fourcc(...codec.split(''));

      // Get output dimensions
      let width = this.metadata.width;
      let height = this.metadata.height;

      if (config.resize) {
        width = config.resize.width;
        height = config.resize.height;
      }

      // Get output FPS
      const fps = config.outputFps || this.metadata.fps;

      // Create video writer
      this.writer = cv2.VideoWriter(
        config.outputPath,
        fourcc,
        fps,
        [width, height]
      );

      if (!this.writer.isOpened()) {
        throw new Error('Failed to initialize video writer');
      }

      console.log(`Output video: ${config.outputPath}`);
      console.log(`Codec: ${codec}, FPS: ${fps}, Size: ${width}x${height}`);
    } catch (error) {
      console.error('Failed to initialize video writer:', error);
      this.writer = null;
    }
  }

  /**
   * Resize frame
   */
  private resizeFrame(
    frame: any,
    resizeConfig: NonNullable<VideoProcessorConfig['resize']>
  ): any {
    let width = resizeConfig.width;
    let height = resizeConfig.height;

    if (resizeConfig.maintainAspectRatio) {
      const frameHeight = frame.shape[0];
      const frameWidth = frame.shape[1];
      const aspectRatio = frameWidth / frameHeight;

      if (width / height > aspectRatio) {
        width = Math.floor(height * aspectRatio);
      } else {
        height = Math.floor(width / aspectRatio);
      }
    }

    return cv2.resize(frame, [width, height], { interpolation: cv2.INTER_AREA });
  }

  /**
   * Read single frame
   *
   * @returns Frame as numpy array or null if end of video
   */
  public readFrame(): any | null {
    if (!this.capture || !this.capture.isOpened()) {
      return null;
    }

    const [success, frame] = this.capture.read();
    return success ? frame : null;
  }

  /**
   * Seek to specific frame
   *
   * @param frameNumber - Frame number to seek to
   * @returns True if seek was successful
   */
  public seekToFrame(frameNumber: number): boolean {
    if (!this.capture) {
      return false;
    }

    try {
      this.capture.set(cv2.CAP_PROP_POS_FRAMES, frameNumber);
      return true;
    } catch (error) {
      console.error('Failed to seek to frame:', error);
      return false;
    }
  }

  /**
   * Seek to specific timestamp (in seconds)
   *
   * @param timestamp - Timestamp in seconds
   * @returns True if seek was successful
   */
  public seekToTimestamp(timestamp: number): boolean {
    if (!this.capture) {
      return false;
    }

    try {
      this.capture.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000);
      return true;
    } catch (error) {
      console.error('Failed to seek to timestamp:', error);
      return false;
    }
  }

  /**
   * Extract frames from video
   *
   * @param source - Video file path
   * @param options - Extraction options
   * @returns Array of extracted frames
   */
  public extractFrames(
    source: string,
    options?: {
      startFrame?: number;
      endFrame?: number;
      interval?: number; // Extract every N frames
      maxFrames?: number;
      resize?: { width: number; height: number };
    }
  ): any[] {
    const opts = {
      startFrame: 0,
      interval: 1,
      ...options,
    };

    if (!this.open(source)) {
      throw new Error('Failed to open video file');
    }

    const frames: any[] = [];

    try {
      // Seek to start frame
      if (opts.startFrame > 0) {
        this.seekToFrame(opts.startFrame);
      }

      let frameNumber = opts.startFrame;

      while (true) {
        // Check max frames limit
        if (opts.maxFrames && frames.length >= opts.maxFrames) {
          break;
        }

        // Check end frame limit
        if (opts.endFrame && frameNumber > opts.endFrame) {
          break;
        }

        // Read frame
        const frame = this.readFrame();
        if (!frame) {
          break;
        }

        // Extract at interval
        if ((frameNumber - opts.startFrame) % opts.interval === 0) {
          let extractedFrame = frame;

          // Resize if needed
          if (opts.resize) {
            extractedFrame = cv2.resize(
              frame,
              [opts.resize.width, opts.resize.height],
              { interpolation: cv2.INTER_AREA }
            );
          }

          frames.push(extractedFrame);
        }

        frameNumber++;
      }

      console.log(`Extracted ${frames.length} frames from video`);
      return frames;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Save frame to image file
   *
   * @param frame - Frame to save
   * @param path - Output file path
   * @returns True if saved successfully
   */
  public saveFrame(frame: any, path: string): boolean {
    try {
      cv2.imwrite(path, frame);
      console.log(`Frame saved to: ${path}`);
      return true;
    } catch (error) {
      console.error('Failed to save frame:', error);
      return false;
    }
  }

  /**
   * Create video from frames
   *
   * @param frames - Array of frames
   * @param outputPath - Output video file path
   * @param options - Video creation options
   * @returns True if created successfully
   */
  public createVideoFromFrames(
    frames: any[],
    outputPath: string,
    options?: {
      fps?: number;
      codec?: VideoCodec;
    }
  ): boolean {
    if (frames.length === 0) {
      console.error('No frames provided');
      return false;
    }

    const opts = {
      fps: 30,
      codec: 'mp4v' as VideoCodec,
      ...options,
    };

    try {
      // Get frame dimensions
      const height = frames[0].shape[0];
      const width = frames[0].shape[1];

      // Create video writer
      const fourcc = cv2.VideoWriter_fourcc(...opts.codec.split(''));
      const writer = cv2.VideoWriter(
        outputPath,
        fourcc,
        opts.fps,
        [width, height]
      );

      if (!writer.isOpened()) {
        throw new Error('Failed to create video writer');
      }

      // Write frames
      for (const frame of frames) {
        writer.write(frame);
      }

      writer.release();

      console.log(`Created video: ${outputPath}`);
      console.log(`Frames: ${frames.length}, FPS: ${opts.fps}`);

      return true;
    } catch (error) {
      console.error('Failed to create video:', error);
      return false;
    }
  }

  /**
   * Batch process multiple videos
   *
   * @param sources - Array of video file paths
   * @param callback - Frame processing callback
   * @param config - Processing configuration
   * @returns Array of processing statistics
   */
  public async batchProcess(
    sources: string[],
    callback: FrameCallback,
    config?: Partial<VideoProcessorConfig>
  ): Promise<ProcessingStats[]> {
    const results: ProcessingStats[] = [];

    for (let i = 0; i < sources.length; i++) {
      console.log(`\nProcessing video ${i + 1}/${sources.length}: ${sources[i]}`);

      try {
        const stats = await this.processVideo(sources[i], callback, config);
        results.push(stats);
      } catch (error) {
        console.error(`Failed to process video ${sources[i]}:`, error);
        results.push(this.initStats());
      }
    }

    console.log('\nBatch processing complete');
    return results;
  }

  /**
   * Apply filter to frame
   *
   * @param frame - Input frame
   * @param filter - Filter type
   * @param params - Filter parameters
   * @returns Filtered frame
   */
  public applyFilter(
    frame: any,
    filter: 'blur' | 'sharpen' | 'edge' | 'grayscale' | 'sepia' | 'brightness',
    params?: any
  ): any {
    try {
      switch (filter) {
        case 'blur': {
          const kernelSize = params?.kernelSize || 5;
          return cv2.GaussianBlur(frame, [kernelSize, kernelSize], 0);
        }

        case 'sharpen': {
          const kernel = numpy.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
          ]);
          return cv2.filter2D(frame, -1, kernel);
        }

        case 'edge': {
          const gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
          return cv2.Canny(gray, 100, 200);
        }

        case 'grayscale': {
          return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
        }

        case 'sepia': {
          const kernel = numpy.array([
            [0.272, 0.534, 0.131],
            [0.349, 0.686, 0.168],
            [0.393, 0.769, 0.189],
          ]);
          return cv2.transform(frame, kernel);
        }

        case 'brightness': {
          const value = params?.value || 50;
          return cv2.add(frame, numpy.array([value, value, value]));
        }

        default:
          return frame;
      }
    } catch (error) {
      console.error(`Failed to apply ${filter} filter:`, error);
      return frame;
    }
  }

  /**
   * Get video metadata
   */
  public getMetadata(): VideoMetadata | null {
    return this.metadata;
  }

  /**
   * Get processing statistics
   */
  public getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Stop processing
   */
  public stop(): void {
    this.isProcessing = false;
    console.log('Processing stopped');
  }

  /**
   * Check if currently processing
   */
  public isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.capture) {
      this.capture.release();
      this.capture = null;
    }

    if (this.writer) {
      this.writer.release();
      this.writer = null;
    }

    if (this.config.enableDisplay) {
      cv2.destroyAllWindows();
    }

    this.isProcessing = false;
  }

  /**
   * Dispose processor and cleanup resources
   */
  public dispose(): void {
    this.cleanup();
    this.metadata = null;
    this.stats = this.initStats();
    console.log('Video processor disposed');
  }
}

/**
 * Video utility functions
 */
export class VideoUtils {
  /**
   * Get supported codecs
   */
  public static getSupportedCodecs(): VideoCodec[] {
    return ['mp4v', 'xvid', 'h264', 'mjpeg', 'vp80', 'vp90'];
  }

  /**
   * Check if codec is supported
   */
  public static isCodecSupported(codec: string): boolean {
    return this.getSupportedCodecs().includes(codec as VideoCodec);
  }

  /**
   * Get video info without processing
   */
  public static getVideoInfo(path: string): VideoMetadata | null {
    try {
      const capture = cv2.VideoCapture(path);

      if (!capture.isOpened()) {
        return null;
      }

      const width = capture.get(cv2.CAP_PROP_FRAME_WIDTH);
      const height = capture.get(cv2.CAP_PROP_FRAME_HEIGHT);
      const fps = capture.get(cv2.CAP_PROP_FPS);
      const totalFrames = capture.get(cv2.CAP_PROP_FRAME_COUNT);
      const fourcc = capture.get(cv2.CAP_PROP_FOURCC);

      capture.release();

      return {
        width: Math.floor(width),
        height: Math.floor(height),
        fps: fps || 30,
        totalFrames: Math.floor(totalFrames),
        duration: totalFrames > 0 ? totalFrames / fps : 0,
        codec: String.fromCharCode(
          fourcc & 0xff,
          (fourcc >> 8) & 0xff,
          (fourcc >> 16) & 0xff,
          (fourcc >> 24) & 0xff
        ),
        format: 'file',
      };
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  /**
   * List available cameras
   */
  public static listCameras(maxIndex: number = 10): number[] {
    const cameras: number[] = [];

    for (let i = 0; i < maxIndex; i++) {
      try {
        const capture = cv2.VideoCapture(i);
        if (capture.isOpened()) {
          cameras.push(i);
          capture.release();
        }
      } catch {
        // Camera not available
      }
    }

    return cameras;
  }

  /**
   * Convert video format
   */
  public static async convertVideo(
    inputPath: string,
    outputPath: string,
    options?: {
      codec?: VideoCodec;
      fps?: number;
      resize?: { width: number; height: number };
    }
  ): Promise<boolean> {
    const processor = new VideoProcessor();

    try {
      await processor.processVideo(
        inputPath,
        (frame) => frame,
        {
          outputPath,
          outputCodec: options?.codec,
          outputFps: options?.fps,
          resize: options?.resize,
        }
      );

      return true;
    } catch (error) {
      console.error('Video conversion failed:', error);
      return false;
    } finally {
      processor.dispose();
    }
  }

  /**
   * Extract thumbnail from video
   */
  public static extractThumbnail(
    videoPath: string,
    outputPath: string,
    options?: {
      timestamp?: number; // seconds
      frameNumber?: number;
      resize?: { width: number; height: number };
    }
  ): boolean {
    try {
      const capture = cv2.VideoCapture(videoPath);

      if (!capture.isOpened()) {
        throw new Error('Failed to open video');
      }

      // Seek to desired position
      if (options?.timestamp !== undefined) {
        capture.set(cv2.CAP_PROP_POS_MSEC, options.timestamp * 1000);
      } else if (options?.frameNumber !== undefined) {
        capture.set(cv2.CAP_PROP_POS_FRAMES, options.frameNumber);
      }

      // Read frame
      const [success, frame] = capture.read();
      capture.release();

      if (!success) {
        throw new Error('Failed to read frame');
      }

      // Resize if needed
      let thumbnail = frame;
      if (options?.resize) {
        thumbnail = cv2.resize(
          frame,
          [options.resize.width, options.resize.height],
          { interpolation: cv2.INTER_AREA }
        );
      }

      // Save thumbnail
      cv2.imwrite(outputPath, thumbnail);

      console.log(`Thumbnail saved to: ${outputPath}`);
      return true;
    } catch (error) {
      console.error('Failed to extract thumbnail:', error);
      return false;
    }
  }
}
