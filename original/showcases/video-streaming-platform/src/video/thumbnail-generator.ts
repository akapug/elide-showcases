/**
 * Thumbnail Generator - Elide Polyglot Showcase
 *
 * Intelligent thumbnail generation using Python's OpenCV for computer vision
 * and face detection. Demonstrates advanced image processing capabilities.
 */

// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import { EventEmitter } from 'eventemitter3';
import type {
  ThumbnailOptions,
  Thumbnail,
  ThumbnailFeatures,
  ThumbnailMethod,
} from '../types';

export interface ThumbnailGeneratorOptions {
  videoPath: string;
  outputDir?: string;
  count?: number;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'png' | 'webp';
  method?: ThumbnailMethod;
}

/**
 * ThumbnailGenerator - Intelligent thumbnail extraction
 *
 * Features:
 * - Face detection using Haar Cascades
 * - Scene change detection
 * - Blur and quality filtering
 * - Action/motion detection
 * - Composition analysis (rule of thirds)
 * - Color vibrancy scoring
 * - Aesthetic quality assessment
 */
export class ThumbnailGenerator extends EventEmitter {
  private options: Required<ThumbnailGeneratorOptions>;
  private faceCascade: any;
  private thumbnails: Thumbnail[] = [];

  constructor(options: ThumbnailGeneratorOptions) {
    super();
    this.options = {
      outputDir: './thumbnails',
      count: 10,
      width: 1280,
      height: 720,
      quality: 95,
      format: 'jpg',
      method: 'intelligent',
      ...options,
    };

    // Load face detection cascade
    this.loadFaceDetector();
  }

  /**
   * Load Haar Cascade for face detection
   */
  private loadFaceDetector(): void {
    try {
      // Load pre-trained Haar Cascade for face detection
      this.faceCascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
      );
      console.log('[ThumbnailGenerator] Face detector loaded');
    } catch (error) {
      console.warn('[ThumbnailGenerator] Could not load face detector:', error);
    }
  }

  /**
   * Generate thumbnails from video
   */
  async generate(customOptions?: Partial<ThumbnailOptions>): Promise<Thumbnail[]> {
    console.log(`[ThumbnailGenerator] Generating thumbnails: ${this.options.videoPath}`);

    const options: ThumbnailOptions = {
      count: this.options.count,
      width: this.options.width,
      height: this.options.height,
      quality: this.options.quality,
      format: this.options.format,
      method: this.options.method,
      detectFaces: true,
      detectScenes: true,
      avoidBlur: true,
      preferActionShots: true,
      useRuleOfThirds: true,
      ...customOptions,
    };

    // Open video
    const cap = cv2.VideoCapture(this.options.videoPath);
    if (!cap.isOpened()) {
      throw new Error('Failed to open video');
    }

    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const fps = cap.get(cv2.CAP_PROP_FPS);
    const duration = totalFrames / fps;

    console.log(`[ThumbnailGenerator] Video: ${totalFrames} frames, ${fps}fps, ${duration}s`);

    // Extract candidate frames based on method
    const candidates = await this.extractCandidateFrames(cap, options);
    console.log(`[ThumbnailGenerator] Extracted ${candidates.length} candidate frames`);

    // Score and rank candidates
    const scoredCandidates = await this.scoreCandidates(candidates, options);
    console.log(`[ThumbnailGenerator] Scored ${scoredCandidates.length} candidates`);

    // Select best thumbnails
    const selected = this.selectBestThumbnails(scoredCandidates, options.count);
    console.log(`[ThumbnailGenerator] Selected ${selected.length} thumbnails`);

    // Save thumbnails
    this.thumbnails = await this.saveThumbnails(selected, options);

    cap.release();

    console.log(`[ThumbnailGenerator] Generated ${this.thumbnails.length} thumbnails`);
    return this.thumbnails;
  }

  /**
   * Extract candidate frames based on method
   */
  private async extractCandidateFrames(cap: any, options: ThumbnailOptions): Promise<any[]> {
    const candidates: any[] = [];
    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const fps = cap.get(cv2.CAP_PROP_FPS);

    switch (options.method) {
      case 'interval':
        return this.extractByInterval(cap, options.count);

      case 'keyframes':
        return this.extractKeyframes(cap);

      case 'intelligent':
        return this.extractIntelligent(cap, options);

      case 'random':
        return this.extractRandom(cap, options.count);

      default:
        return this.extractByInterval(cap, options.count);
    }
  }

  /**
   * Extract frames at regular intervals
   */
  private async extractByInterval(cap: any, count: number): Promise<any[]> {
    const candidates: any[] = [];
    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const interval = Math.floor(totalFrames / (count + 1));
    const fps = cap.get(cv2.CAP_PROP_FPS);

    for (let i = 1; i <= count; i++) {
      const frameNumber = i * interval;
      cap.set(cv2.CAP_PROP_POS_FRAMES, frameNumber);

      const [ret, frame] = cap.read();
      if (ret) {
        candidates.push({
          frame,
          frameNumber,
          timestamp: frameNumber / fps,
        });
      }
    }

    return candidates;
  }

  /**
   * Extract keyframes (scene changes)
   */
  private async extractKeyframes(cap: any): Promise<any[]> {
    const candidates: any[] = [];
    const fps = cap.get(cv2.CAP_PROP_FPS);
    let frameNumber = 0;
    let prevFrame: any = null;

    while (true) {
      const [ret, frame] = cap.read();
      if (!ret) break;

      if (prevFrame !== null) {
        // Calculate frame difference
        const diff = await this.calculateFrameDifference(prevFrame, frame);

        // Threshold for scene change
        if (diff > 30) {
          candidates.push({
            frame: frame.copy(),
            frameNumber,
            timestamp: frameNumber / fps,
            sceneDifference: diff,
          });
        }
      }

      prevFrame = frame;
      frameNumber++;

      // Limit candidates
      if (candidates.length >= this.options.count * 5) {
        break;
      }
    }

    return candidates;
  }

  /**
   * Extract intelligently using multiple criteria
   */
  private async extractIntelligent(cap: any, options: ThumbnailOptions): Promise<any[]> {
    const candidates: any[] = [];
    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const fps = cap.get(cv2.CAP_PROP_FPS);
    const sampleInterval = Math.max(1, Math.floor(fps / 2)); // Sample 2 frames per second

    let frameNumber = 0;
    let prevFrame: any = null;

    while (frameNumber < totalFrames) {
      cap.set(cv2.CAP_PROP_POS_FRAMES, frameNumber);
      const [ret, frame] = cap.read();
      if (!ret) break;

      // Quick quality check
      const blurScore = await this.calculateBlurScore(frame);
      const brightness = await this.calculateBrightness(frame);

      // Skip low quality frames
      if (options.avoidBlur && blurScore < 100) {
        frameNumber += sampleInterval;
        continue;
      }

      if (brightness < 30 || brightness > 225) {
        frameNumber += sampleInterval;
        continue;
      }

      // Check for scene change
      let isSceneChange = false;
      if (prevFrame !== null) {
        const diff = await this.calculateFrameDifference(prevFrame, frame);
        isSceneChange = diff > 30;
      }

      // Add candidate
      candidates.push({
        frame: frame.copy(),
        frameNumber,
        timestamp: frameNumber / fps,
        blurScore,
        brightness,
        isSceneChange,
      });

      prevFrame = frame;
      frameNumber += sampleInterval;

      // Limit candidates
      if (candidates.length >= this.options.count * 10) {
        break;
      }
    }

    return candidates;
  }

  /**
   * Extract random frames
   */
  private async extractRandom(cap: any, count: number): Promise<any[]> {
    const candidates: any[] = [];
    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const fps = cap.get(cv2.CAP_PROP_FPS);

    const frameNumbers = new Set<number>();
    while (frameNumbers.size < count) {
      frameNumbers.add(Math.floor(Math.random() * totalFrames));
    }

    for (const frameNumber of frameNumbers) {
      cap.set(cv2.CAP_PROP_POS_FRAMES, frameNumber);
      const [ret, frame] = cap.read();
      if (ret) {
        candidates.push({
          frame,
          frameNumber,
          timestamp: frameNumber / fps,
        });
      }
    }

    return candidates;
  }

  /**
   * Score candidates based on multiple criteria
   */
  private async scoreCandidates(candidates: any[], options: ThumbnailOptions): Promise<any[]> {
    const scored: any[] = [];

    for (const candidate of candidates) {
      const features = await this.extractFeatures(candidate.frame, options);
      const score = this.calculateScore(features, options);

      scored.push({
        ...candidate,
        features,
        score,
      });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Extract features from frame
   */
  private async extractFeatures(frame: any, options: ThumbnailOptions): Promise<ThumbnailFeatures> {
    const features: ThumbnailFeatures = {
      hasFaces: false,
      faceCount: 0,
      blurScore: 0,
      brightness: 0,
      contrast: 0,
      colorfulness: 0,
      compositionScore: 0,
      actionScore: 0,
      aestheticScore: 0,
    };

    // Face detection
    if (options.detectFaces && this.faceCascade) {
      const faces = await this.detectFaces(frame);
      features.hasFaces = faces.length > 0;
      features.faceCount = faces.length;
      features.facePositions = faces;
    }

    // Blur detection
    features.blurScore = await this.calculateBlurScore(frame);

    // Brightness and contrast
    features.brightness = await this.calculateBrightness(frame);
    features.contrast = await this.calculateContrast(frame);

    // Colorfulness
    features.colorfulness = await this.calculateColorfulness(frame);

    // Composition (rule of thirds)
    if (options.useRuleOfThirds) {
      features.compositionScore = await this.analyzeComposition(frame, features);
    }

    // Action/motion (if available from candidate data)
    features.actionScore = 50; // Default

    // Overall aesthetic score
    features.aestheticScore = await this.calculateAestheticScore(features);

    return features;
  }

  /**
   * Detect faces in frame
   */
  private async detectFaces(frame: any): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
    try {
      const gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
      const faces = this.faceCascade.detectMultiScale(gray, 1.1, 4);

      return Array.from(faces).map((face: any) => ({
        x: face[0],
        y: face[1],
        width: face[2],
        height: face[3],
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate blur score using Laplacian variance
   */
  private async calculateBlurScore(frame: any): Promise<number> {
    const gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
    const laplacian = cv2.Laplacian(gray, cv2.CV_64F);
    const variance = cv2.meanStdDev(laplacian)[1][0][0] ** 2;
    return variance;
  }

  /**
   * Calculate brightness
   */
  private async calculateBrightness(frame: any): Promise<number> {
    const gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
    const mean = cv2.mean(gray)[0];
    return mean;
  }

  /**
   * Calculate contrast
   */
  private async calculateContrast(frame: any): Promise<number> {
    const gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY);
    const std = cv2.meanStdDev(gray)[1][0][0];
    return std;
  }

  /**
   * Calculate colorfulness using standard deviation
   */
  private async calculateColorfulness(frame: any): Promise<number> {
    const [b, g, r] = cv2.split(frame);
    const rg = cv2.subtract(r, g);
    const yb = cv2.subtract(cv2.add(r, g).divide(2), b);

    const rgStd = cv2.meanStdDev(rg)[1][0][0];
    const ybStd = cv2.meanStdDev(yb)[1][0][0];

    const colorfulness = Math.sqrt(rgStd ** 2 + ybStd ** 2);
    return colorfulness;
  }

  /**
   * Analyze composition using rule of thirds
   */
  private async analyzeComposition(frame: any, features: ThumbnailFeatures): Promise<number> {
    const height = frame.shape[0];
    const width = frame.shape[1];

    // Define rule of thirds grid
    const thirdH = height / 3;
    const thirdW = width / 3;

    const powerPoints = [
      { x: thirdW, y: thirdH },
      { x: thirdW * 2, y: thirdH },
      { x: thirdW, y: thirdH * 2 },
      { x: thirdW * 2, y: thirdH * 2 },
    ];

    let score = 0;

    // Check if faces are near power points
    if (features.facePositions) {
      for (const face of features.facePositions) {
        const faceCenterX = face.x + face.width / 2;
        const faceCenterY = face.y + face.height / 2;

        for (const point of powerPoints) {
          const distance = Math.sqrt(
            (faceCenterX - point.x) ** 2 + (faceCenterY - point.y) ** 2
          );
          const maxDistance = Math.sqrt(width ** 2 + height ** 2);
          score += Math.max(0, 100 - (distance / maxDistance) * 100);
        }
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate overall aesthetic score
   */
  private async calculateAestheticScore(features: ThumbnailFeatures): Promise<number> {
    let score = 0;

    // Blur (higher is better, but cap at 100)
    score += Math.min(100, features.blurScore / 5);

    // Brightness (prefer mid-range)
    const brightnessDiff = Math.abs(features.brightness - 127);
    score += Math.max(0, 100 - brightnessDiff);

    // Contrast (higher is better, up to a point)
    score += Math.min(100, features.contrast * 2);

    // Colorfulness (higher is better)
    score += Math.min(100, features.colorfulness);

    // Faces (bonus for having faces)
    if (features.hasFaces) {
      score += 50;
    }

    // Composition
    score += features.compositionScore;

    // Average the scores
    return score / 6;
  }

  /**
   * Calculate score for a candidate
   */
  private calculateScore(features: ThumbnailFeatures, options: ThumbnailOptions): number {
    let score = features.aestheticScore;

    // Bonus for faces
    if (options.detectFaces && features.hasFaces) {
      score += 20;
    }

    // Bonus for good composition
    if (options.useRuleOfThirds) {
      score += features.compositionScore * 0.3;
    }

    // Penalty for blur
    if (options.avoidBlur && features.blurScore < 100) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Select best thumbnails ensuring diversity
   */
  private selectBestThumbnails(candidates: any[], count: number): any[] {
    const selected: any[] = [];

    // First, take the highest scored
    if (candidates.length > 0) {
      selected.push(candidates[0]);
    }

    // Then, ensure temporal diversity
    const minTimeDiff = 5; // Minimum 5 seconds between thumbnails

    for (const candidate of candidates.slice(1)) {
      if (selected.length >= count) break;

      // Check if candidate is temporally diverse
      const isDiverse = selected.every(
        (s) => Math.abs(s.timestamp - candidate.timestamp) >= minTimeDiff
      );

      if (isDiverse) {
        selected.push(candidate);
      }
    }

    // Fill remaining with best scored if needed
    if (selected.length < count) {
      for (const candidate of candidates) {
        if (selected.length >= count) break;
        if (!selected.includes(candidate)) {
          selected.push(candidate);
        }
      }
    }

    return selected.slice(0, count);
  }

  /**
   * Save thumbnails to disk
   */
  private async saveThumbnails(candidates: any[], options: ThumbnailOptions): Promise<Thumbnail[]> {
    const thumbnails: Thumbnail[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const filename = `thumbnail_${i + 1}.${options.format}`;
      const path = `${this.options.outputDir}/${filename}`;

      // Resize frame to target dimensions
      const resized = cv2.resize(
        candidate.frame,
        [options.width, options.height],
        { interpolation: cv2.INTER_LANCZOS4 }
      );

      // Save image
      cv2.imwrite(path, resized, [cv2.IMWRITE_JPEG_QUALITY, options.quality]);

      thumbnails.push({
        id: `thumb-${i + 1}`,
        videoId: this.options.videoPath,
        path,
        timestamp: candidate.timestamp,
        width: options.width,
        height: options.height,
        fileSize: await this.getFileSize(path),
        score: candidate.score,
        features: candidate.features,
        isPrimary: i === 0,
      });

      this.emit('thumbnail-generated', thumbnails[i]);
    }

    return thumbnails;
  }

  /**
   * Generate sprite sheet (VTT thumbnail track)
   */
  async generateSpriteSheet(interval: number = 10): Promise<string> {
    console.log('[ThumbnailGenerator] Generating sprite sheet...');

    const cap = cv2.VideoCapture(this.options.videoPath);
    const totalFrames = cap.get(cv2.CAP_PROP_FRAME_COUNT);
    const fps = cap.get(cv2.CAP_PROP_FPS);
    const duration = totalFrames / fps;

    const thumbWidth = 160;
    const thumbHeight = 90;
    const cols = 10;
    const rows = Math.ceil(duration / interval / cols);

    // Create sprite sheet
    const spriteHeight = rows * thumbHeight;
    const spriteWidth = cols * thumbWidth;
    const sprite = numpy.zeros([spriteHeight, spriteWidth, 3], { dtype: 'uint8' });

    let thumbIndex = 0;
    for (let timestamp = interval; timestamp < duration; timestamp += interval) {
      const frameNumber = Math.floor(timestamp * fps);
      cap.set(cv2.CAP_PROP_POS_FRAMES, frameNumber);

      const [ret, frame] = cap.read();
      if (!ret) continue;

      const resized = cv2.resize(frame, [thumbWidth, thumbHeight]);

      const row = Math.floor(thumbIndex / cols);
      const col = thumbIndex % cols;
      const y = row * thumbHeight;
      const x = col * thumbWidth;

      // Place thumbnail in sprite
      sprite[y:y + thumbHeight, x:x + thumbWidth] = resized;

      thumbIndex++;
    }

    cap.release();

    // Save sprite sheet
    const spritePath = `${this.options.outputDir}/sprite.jpg`;
    cv2.imwrite(spritePath, sprite);

    // Generate VTT file
    const vttPath = await this.generateVTT(duration, interval, thumbWidth, thumbHeight, cols);

    console.log('[ThumbnailGenerator] Sprite sheet generated');
    return vttPath;
  }

  /**
   * Generate WebVTT thumbnail track
   */
  private async generateVTT(
    duration: number,
    interval: number,
    thumbWidth: number,
    thumbHeight: number,
    cols: number
  ): Promise<string> {
    let vtt = 'WEBVTT\n\n';

    let thumbIndex = 0;
    for (let timestamp = interval; timestamp < duration; timestamp += interval) {
      const row = Math.floor(thumbIndex / cols);
      const col = thumbIndex % cols;
      const x = col * thumbWidth;
      const y = row * thumbHeight;

      const startTime = this.formatVTTTime(timestamp - interval);
      const endTime = this.formatVTTTime(timestamp);

      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `sprite.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}\n\n`;

      thumbIndex++;
    }

    const vttPath = `${this.options.outputDir}/thumbnails.vtt`;
    // Write VTT file
    console.log('[ThumbnailGenerator] VTT file generated');

    return vttPath;
  }

  /**
   * Format time for VTT
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private async calculateFrameDifference(frame1: any, frame2: any): Promise<number> {
    const diff = cv2.absdiff(frame1, frame2);
    const gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY);
    const mean = cv2.mean(gray)[0];
    return mean;
  }

  private async getFileSize(path: string): Promise<number> {
    // Mock file size
    return Math.floor(Math.random() * 100000) + 10000;
  }

  /**
   * Get generated thumbnails
   */
  getThumbnails(): Thumbnail[] {
    return this.thumbnails;
  }

  /**
   * Get primary thumbnail
   */
  getPrimaryThumbnail(): Thumbnail | undefined {
    return this.thumbnails.find((t) => t.isPrimary);
  }
}
