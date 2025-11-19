/**
 * Face Tracker Module for Computer Vision Platform
 *
 * Demonstrates Elide's polyglot capabilities by combining Python's
 * cv2 and dlib libraries with TypeScript for real-time face tracking.
 *
 * Features:
 * - Real-time face tracking in video streams
 * - Track multiple faces simultaneously
 * - Maintain face identity across frames
 * - Handle occlusions and re-identification
 * - Performance optimization with frame skipping
 */

// @ts-ignore - Elide polyglot import: cv2 for video processing
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import: numpy for array operations
import numpy from 'python:numpy';
// @ts-ignore - Elide polyglot import: dlib for correlation tracker
import dlib from 'python:dlib';

import { FaceDetector, FaceDetectionResult } from './face-detector';
import { FaceDatabase, FaceMatch } from './face-database';

/**
 * Tracked face information
 */
export interface TrackedFace {
  trackId: string;
  name?: string;
  box: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  confidence: number;
  tracker: any; // dlib correlation tracker
  framesSinceUpdate: number;
  lastSeen: number;
  encoding?: number[];
  matchedFace?: FaceMatch;
  history: Array<{
    frameNumber: number;
    box: any;
    confidence: number;
  }>;
}

/**
 * Tracking configuration
 */
export interface TrackerConfig {
  maxTrackedFaces: number;
  detectionInterval: number; // frames between full detection
  maxFramesSinceUpdate: number;
  minTrackingConfidence: number;
  reidentificationThreshold: number;
  trackingAlgorithm: 'correlation' | 'kcf' | 'medianflow';
  enableRecognition: boolean;
  recognitionInterval: number; // frames between recognition attempts
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  type: 'face_detected' | 'face_lost' | 'face_identified' | 'face_moved';
  trackId: string;
  name?: string;
  frameNumber: number;
  timestamp: number;
  data?: any;
}

/**
 * Default tracker configuration
 */
const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  maxTrackedFaces: 10,
  detectionInterval: 30, // Detect every 30 frames
  maxFramesSinceUpdate: 60, // Drop track after 60 frames
  minTrackingConfidence: 0.5,
  reidentificationThreshold: 0.6,
  trackingAlgorithm: 'correlation',
  enableRecognition: true,
  recognitionInterval: 15, // Recognize every 15 frames
};

/**
 * Face Tracker class for real-time face tracking
 *
 * Showcases Elide's polyglot capabilities with Python computer vision libraries
 */
export class FaceTracker {
  private config: TrackerConfig;
  private detector: FaceDetector;
  private database?: FaceDatabase;
  private trackedFaces: Map<string, TrackedFace>;
  private nextTrackId: number = 0;
  private frameNumber: number = 0;
  private eventListeners: Map<string, Array<(event: TrackingEvent) => void>>;

  constructor(
    detector: FaceDetector,
    database?: FaceDatabase,
    config?: Partial<TrackerConfig>
  ) {
    this.detector = detector;
    this.database = database;
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
    this.trackedFaces = new Map();
    this.eventListeners = new Map();

    console.log('Face tracker initialized with config:', this.config);
  }

  /**
   * Process a single frame and update tracked faces
   *
   * @param frame - Video frame as numpy array
   * @returns Array of currently tracked faces
   */
  public processFrame(frame: any): TrackedFace[] {
    this.frameNumber++;

    try {
      // Update existing trackers
      this.updateTrackers(frame);

      // Perform full detection at intervals
      if (this.frameNumber % this.config.detectionInterval === 0) {
        this.detectNewFaces(frame);
      }

      // Perform recognition at intervals
      if (
        this.config.enableRecognition &&
        this.database &&
        this.frameNumber % this.config.recognitionInterval === 0
      ) {
        this.recognizeFaces(frame);
      }

      // Remove stale tracks
      this.removeStaleTracks();

      return Array.from(this.trackedFaces.values());
    } catch (error) {
      console.error(`Error processing frame ${this.frameNumber}:`, error);
      return [];
    }
  }

  /**
   * Update existing correlation trackers
   */
  private updateTrackers(frame: any): void {
    for (const [trackId, tracked] of this.trackedFaces.entries()) {
      try {
        // Update tracker position
        const quality = tracked.tracker.update(frame);

        if (quality >= this.config.minTrackingConfidence) {
          // Get updated position
          const pos = tracked.tracker.get_position();

          // Update tracked face
          tracked.box = {
            left: Math.floor(pos.left()),
            top: Math.floor(pos.top()),
            right: Math.floor(pos.right()),
            bottom: Math.floor(pos.bottom()),
          };

          tracked.confidence = quality;
          tracked.framesSinceUpdate = 0;
          tracked.lastSeen = this.frameNumber;

          // Add to history
          tracked.history.push({
            frameNumber: this.frameNumber,
            box: { ...tracked.box },
            confidence: quality,
          });

          // Limit history size
          if (tracked.history.length > 100) {
            tracked.history.shift();
          }

          // Emit tracking event
          this.emitEvent({
            type: 'face_moved',
            trackId,
            name: tracked.name,
            frameNumber: this.frameNumber,
            timestamp: Date.now(),
            data: { box: tracked.box, confidence: quality },
          });
        } else {
          // Tracking quality too low
          tracked.framesSinceUpdate++;
        }
      } catch (error) {
        console.error(`Failed to update tracker ${trackId}:`, error);
        tracked.framesSinceUpdate++;
      }
    }
  }

  /**
   * Detect new faces in frame
   */
  private detectNewFaces(frame: any): void {
    try {
      // Detect faces
      const detections = this.detector.detect(frame, {
        includeConfidence: true,
        includeEncoding: this.config.enableRecognition,
      });

      // Process each detection
      for (const detection of detections) {
        // Check if face overlaps with existing track
        const existingTrack = this.findOverlappingTrack(detection.box);

        if (existingTrack) {
          // Update existing track
          this.updateTrack(existingTrack, detection, frame);
        } else if (this.trackedFaces.size < this.config.maxTrackedFaces) {
          // Create new track
          this.createTrack(detection, frame);
        }
      }
    } catch (error) {
      console.error('Face detection failed:', error);
    }
  }

  /**
   * Find track that overlaps with given bounding box
   */
  private findOverlappingTrack(box: any): TrackedFace | null {
    let bestTrack: TrackedFace | null = null;
    let bestIOU = 0;

    for (const tracked of this.trackedFaces.values()) {
      const iou = this.calculateIOU(box, tracked.box);

      if (iou > 0.5 && iou > bestIOU) {
        bestIOU = iou;
        bestTrack = tracked;
      }
    }

    return bestTrack;
  }

  /**
   * Calculate Intersection over Union (IoU)
   */
  private calculateIOU(box1: any, box2: any): number {
    // Calculate intersection area
    const x1 = Math.max(box1.left, box2.left);
    const y1 = Math.max(box1.top, box2.top);
    const x2 = Math.min(box1.right, box2.right);
    const y2 = Math.min(box1.bottom, box2.bottom);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);

    // Calculate union area
    const box1Area = (box1.right - box1.left) * (box1.bottom - box1.top);
    const box2Area = (box2.right - box2.left) * (box2.bottom - box2.top);
    const unionArea = box1Area + box2Area - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }

  /**
   * Create new face track
   */
  private createTrack(detection: FaceDetectionResult, frame: any): void {
    const trackId = `track_${this.nextTrackId++}`;

    // Create correlation tracker
    const tracker = this.createTracker();

    // Start tracking
    const rect = dlib.rectangle(
      detection.box.left,
      detection.box.top,
      detection.box.right,
      detection.box.bottom
    );

    tracker.start_track(frame, rect);

    // Create tracked face
    const tracked: TrackedFace = {
      trackId,
      box: detection.box,
      confidence: detection.confidence,
      tracker,
      framesSinceUpdate: 0,
      lastSeen: this.frameNumber,
      encoding: detection.encoding,
      history: [{
        frameNumber: this.frameNumber,
        box: { ...detection.box },
        confidence: detection.confidence,
      }],
    };

    this.trackedFaces.set(trackId, tracked);

    console.log(`Created new track: ${trackId}`);

    // Emit event
    this.emitEvent({
      type: 'face_detected',
      trackId,
      frameNumber: this.frameNumber,
      timestamp: Date.now(),
      data: { box: detection.box },
    });
  }

  /**
   * Update existing track with new detection
   */
  private updateTrack(
    tracked: TrackedFace,
    detection: FaceDetectionResult,
    frame: any
  ): void {
    // Restart tracker with new position
    const rect = dlib.rectangle(
      detection.box.left,
      detection.box.top,
      detection.box.right,
      detection.box.bottom
    );

    tracked.tracker.start_track(frame, rect);

    // Update track data
    tracked.box = detection.box;
    tracked.confidence = detection.confidence;
    tracked.framesSinceUpdate = 0;
    tracked.lastSeen = this.frameNumber;

    if (detection.encoding) {
      tracked.encoding = detection.encoding;
    }
  }

  /**
   * Create tracker based on algorithm configuration
   */
  private createTracker(): any {
    switch (this.config.trackingAlgorithm) {
      case 'correlation':
        return dlib.correlation_tracker();
      case 'kcf':
        // OpenCV KCF tracker
        return cv2.TrackerKCF_create();
      case 'medianflow':
        // OpenCV MedianFlow tracker
        return cv2.legacy.TrackerMedianFlow_create();
      default:
        return dlib.correlation_tracker();
    }
  }

  /**
   * Recognize tracked faces using database
   */
  private recognizeFaces(frame: any): void {
    if (!this.database) {
      return;
    }

    for (const [trackId, tracked] of this.trackedFaces.entries()) {
      // Skip if already identified
      if (tracked.name) {
        continue;
      }

      // Skip if no encoding
      if (!tracked.encoding) {
        // Try to get encoding for current position
        try {
          const encoding = this.detector.encode(frame, tracked.box);
          tracked.encoding = encoding;
        } catch (error) {
          continue;
        }
      }

      // Find match in database
      const match = this.database.findMatch(
        tracked.encoding,
        this.config.reidentificationThreshold
      );

      if (match && match.isMatch) {
        tracked.name = match.face.name;
        tracked.matchedFace = match;

        console.log(`Identified track ${trackId} as ${match.face.name}`);

        // Emit event
        this.emitEvent({
          type: 'face_identified',
          trackId,
          name: match.face.name,
          frameNumber: this.frameNumber,
          timestamp: Date.now(),
          data: { match },
        });
      }
    }
  }

  /**
   * Remove tracks that haven't been updated recently
   */
  private removeStaleTracks(): void {
    const toRemove: string[] = [];

    for (const [trackId, tracked] of this.trackedFaces.entries()) {
      if (tracked.framesSinceUpdate > this.config.maxFramesSinceUpdate) {
        toRemove.push(trackId);
      }
    }

    for (const trackId of toRemove) {
      const tracked = this.trackedFaces.get(trackId);
      this.trackedFaces.delete(trackId);

      console.log(`Removed stale track: ${trackId}`);

      // Emit event
      this.emitEvent({
        type: 'face_lost',
        trackId,
        name: tracked?.name,
        frameNumber: this.frameNumber,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get currently tracked faces
   */
  public getTrackedFaces(): TrackedFace[] {
    return Array.from(this.trackedFaces.values());
  }

  /**
   * Get specific tracked face by ID
   */
  public getTrackedFace(trackId: string): TrackedFace | undefined {
    return this.trackedFaces.get(trackId);
  }

  /**
   * Get tracked faces by name
   */
  public getTrackedFacesByName(name: string): TrackedFace[] {
    const faces: TrackedFace[] = [];

    for (const tracked of this.trackedFaces.values()) {
      if (tracked.name === name) {
        faces.push(tracked);
      }
    }

    return faces;
  }

  /**
   * Reset tracker (clear all tracked faces)
   */
  public reset(): void {
    this.trackedFaces.clear();
    this.frameNumber = 0;
    this.nextTrackId = 0;
    console.log('Face tracker reset');
  }

  /**
   * Add event listener
   */
  public addEventListener(
    eventType: TrackingEvent['type'],
    callback: (event: TrackingEvent) => void
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    eventType: TrackingEvent['type'],
    callback: (event: TrackingEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType);

    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit tracking event
   */
  private emitEvent(event: TrackingEvent): void {
    const listeners = this.eventListeners.get(event.type);

    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      }
    }
  }

  /**
   * Get tracker statistics
   */
  public getStats(): {
    frameNumber: number;
    trackedFaceCount: number;
    identifiedFaceCount: number;
    averageConfidence: number;
  } {
    let identifiedCount = 0;
    let totalConfidence = 0;

    for (const tracked of this.trackedFaces.values()) {
      if (tracked.name) {
        identifiedCount++;
      }
      totalConfidence += tracked.confidence;
    }

    const trackedCount = this.trackedFaces.size;

    return {
      frameNumber: this.frameNumber,
      trackedFaceCount: trackedCount,
      identifiedFaceCount: identifiedCount,
      averageConfidence: trackedCount > 0 ? totalConfidence / trackedCount : 0,
    };
  }

  /**
   * Update tracker configuration
   */
  public updateConfig(config: Partial<TrackerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Tracker config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): TrackerConfig {
    return { ...this.config };
  }

  /**
   * Draw tracked faces on frame
   *
   * @param frame - Video frame
   * @param options - Drawing options
   * @returns Frame with drawn annotations
   */
  public drawTrackedFaces(
    frame: any,
    options?: {
      drawBox?: boolean;
      drawLabel?: boolean;
      drawTrackId?: boolean;
      drawConfidence?: boolean;
      boxColor?: [number, number, number];
      boxThickness?: number;
    }
  ): any {
    const opts = {
      drawBox: true,
      drawLabel: true,
      drawTrackId: false,
      drawConfidence: true,
      boxColor: [0, 255, 0] as [number, number, number],
      boxThickness: 2,
      ...options,
    };

    const annotatedFrame = frame.copy();

    for (const tracked of this.trackedFaces.values()) {
      const { box } = tracked;

      // Draw bounding box
      if (opts.drawBox) {
        const color = tracked.name
          ? [0, 255, 0] // Green for identified
          : [255, 0, 0]; // Blue for unidentified

        cv2.rectangle(
          annotatedFrame,
          [box.left, box.top],
          [box.right, box.bottom],
          color,
          opts.boxThickness
        );
      }

      // Draw label
      if (opts.drawLabel || opts.drawTrackId || opts.drawConfidence) {
        const labels: string[] = [];

        if (opts.drawLabel && tracked.name) {
          labels.push(tracked.name);
        }

        if (opts.drawTrackId) {
          labels.push(tracked.trackId);
        }

        if (opts.drawConfidence) {
          labels.push(`${(tracked.confidence * 100).toFixed(1)}%`);
        }

        const label = labels.join(' | ');

        // Draw label background
        const fontSize = 0.6;
        const fontThickness = 1;
        const textSize = cv2.getTextSize(
          label,
          cv2.FONT_HERSHEY_SIMPLEX,
          fontSize,
          fontThickness
        )[0];

        cv2.rectangle(
          annotatedFrame,
          [box.left, box.top - textSize[1] - 10],
          [box.left + textSize[0], box.top],
          [0, 0, 0],
          -1
        );

        // Draw label text
        cv2.putText(
          annotatedFrame,
          label,
          [box.left, box.top - 5],
          cv2.FONT_HERSHEY_SIMPLEX,
          fontSize,
          [255, 255, 255],
          fontThickness
        );
      }
    }

    return annotatedFrame;
  }

  /**
   * Export tracking data to JSON
   */
  public exportTrackingData(): any {
    const tracks: any[] = [];

    for (const tracked of this.trackedFaces.values()) {
      tracks.push({
        trackId: tracked.trackId,
        name: tracked.name,
        box: tracked.box,
        confidence: tracked.confidence,
        lastSeen: tracked.lastSeen,
        framesSinceUpdate: tracked.framesSinceUpdate,
        history: tracked.history,
        matchedFace: tracked.matchedFace
          ? {
              name: tracked.matchedFace.face.name,
              distance: tracked.matchedFace.distance,
              similarity: tracked.matchedFace.similarity,
            }
          : undefined,
      });
    }

    return {
      frameNumber: this.frameNumber,
      trackedFaceCount: this.trackedFaces.size,
      tracks,
    };
  }
}

/**
 * Multi-object tracker for tracking multiple faces
 */
export class MultiObjectTracker {
  private trackers: Map<string, FaceTracker>;

  constructor() {
    this.trackers = new Map();
  }

  /**
   * Create a new tracker instance
   */
  public createTracker(
    id: string,
    detector: FaceDetector,
    database?: FaceDatabase,
    config?: Partial<TrackerConfig>
  ): FaceTracker {
    const tracker = new FaceTracker(detector, database, config);
    this.trackers.set(id, tracker);
    return tracker;
  }

  /**
   * Get tracker by ID
   */
  public getTracker(id: string): FaceTracker | undefined {
    return this.trackers.get(id);
  }

  /**
   * Remove tracker
   */
  public removeTracker(id: string): boolean {
    return this.trackers.delete(id);
  }

  /**
   * Get all tracker IDs
   */
  public getTrackerIds(): string[] {
    return Array.from(this.trackers.keys());
  }

  /**
   * Reset all trackers
   */
  public resetAll(): void {
    for (const tracker of this.trackers.values()) {
      tracker.reset();
    }
  }
}
