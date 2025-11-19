/**
 * Object Tracking - SORT/DeepSORT in TypeScript!
 *
 * Demonstrates:
 * - python:cv2 for video processing and tracking
 * - python:numpy for Kalman filter implementation
 * - Object tracking across video frames
 * - IoU-based data association
 *
 * This is ONLY possible with Elide's polyglot runtime!
 */

// @ts-ignore - OpenCV for tracking and visualization
import cv2 from 'python:cv2';
// @ts-ignore - NumPy for numerical operations
import numpy from 'python:numpy';

import type {
  TrackedObject,
  TrackingConfig,
  BoundingBox,
  DetectionResult,
  ImageData,
} from '../types.js';

// ============================================================================
// Kalman Filter for Object Motion Prediction
// ============================================================================

/**
 * Kalman Filter for tracking object position and velocity
 *
 * State vector: [x, y, vx, vy, w, h]
 * - x, y: center position
 * - vx, vy: velocity
 * - w, h: width and height
 */
class KalmanFilter {
  private kf: any;
  private stateSize: number;
  private measurementSize: number;
  private initialized: boolean;

  constructor() {
    this.stateSize = 6; // [x, y, vx, vy, w, h]
    this.measurementSize = 4; // [x, y, w, h]
    this.initialized = false;

    // Create Kalman filter using OpenCV
    this.kf = cv2.KalmanFilter(this.stateSize, this.measurementSize, 0);

    // State transition matrix (constant velocity model)
    // x' = x + vx * dt
    // y' = y + vy * dt
    this.kf.transitionMatrix = numpy.array([
      [1, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
    ], { dtype: 'float32' });

    // Measurement matrix (we only observe position and size)
    this.kf.measurementMatrix = numpy.array([
      [1, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1],
    ], { dtype: 'float32' });

    // Process noise covariance
    this.kf.processNoiseCov = numpy.eye(this.stateSize, { dtype: 'float32' }).mul(0.03);

    // Measurement noise covariance
    this.kf.measurementNoiseCov = numpy.eye(this.measurementSize, { dtype: 'float32' }).mul(0.1);

    // Error covariance
    this.kf.errorCovPost = numpy.eye(this.stateSize, { dtype: 'float32' });
  }

  /**
   * Initialize filter with first measurement
   */
  initiate(bbox: BoundingBox): void {
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;

    this.kf.statePost = numpy.array([
      [x],
      [y],
      [0],
      [0],
      [bbox.width],
      [bbox.height],
    ], { dtype: 'float32' });

    this.initialized = true;
  }

  /**
   * Predict next state
   */
  predict(): BoundingBox {
    const prediction = this.kf.predict();

    const x = Number(prediction[0][0]);
    const y = Number(prediction[1][0]);
    const w = Number(prediction[4][0]);
    const h = Number(prediction[5][0]);

    return {
      x: Math.round(x - w / 2),
      y: Math.round(y - h / 2),
      width: Math.round(w),
      height: Math.round(h),
    };
  }

  /**
   * Update filter with new measurement
   */
  update(bbox: BoundingBox): void {
    const x = bbox.x + bbox.width / 2;
    const y = bbox.y + bbox.height / 2;

    const measurement = numpy.array([
      [x],
      [y],
      [bbox.width],
      [bbox.height],
    ], { dtype: 'float32' });

    this.kf.correct(measurement);
  }

  /**
   * Get current velocity
   */
  getVelocity(): { vx: number; vy: number } {
    const state = this.kf.statePost;
    return {
      vx: Number(state[2][0]),
      vy: Number(state[3][0]),
    };
  }

  /**
   * Get current state
   */
  getState(): BoundingBox {
    const state = this.kf.statePost;

    const x = Number(state[0][0]);
    const y = Number(state[1][0]);
    const w = Number(state[4][0]);
    const h = Number(state[5][0]);

    return {
      x: Math.round(x - w / 2),
      y: Math.round(y - h / 2),
      width: Math.round(w),
      height: Math.round(h),
    };
  }
}

// ============================================================================
// Track Class
// ============================================================================

class Track {
  id: number;
  class: string;
  bbox: BoundingBox;
  confidence: number;
  age: number;
  hits: number;
  hitStreak: number;
  timeSinceUpdate: number;
  velocity?: { vx: number; vy: number };
  filter: KalmanFilter;

  constructor(detection: DetectionResult, trackId: number) {
    this.id = trackId;
    this.class = detection.class;
    this.bbox = detection.bbox;
    this.confidence = detection.confidence;
    this.age = 0;
    this.hits = 1;
    this.hitStreak = 1;
    this.timeSinceUpdate = 0;

    // Initialize Kalman filter
    this.filter = new KalmanFilter();
    this.filter.initiate(detection.bbox);
    this.velocity = { vx: 0, vy: 0 };
  }

  /**
   * Predict next position
   */
  predict(): void {
    this.bbox = this.filter.predict();
    this.velocity = this.filter.getVelocity();
    this.age += 1;
    this.timeSinceUpdate += 1;
  }

  /**
   * Update with new detection
   */
  update(detection: DetectionResult): void {
    this.bbox = detection.bbox;
    this.confidence = detection.confidence;
    this.hits += 1;
    this.hitStreak += 1;
    this.timeSinceUpdate = 0;

    this.filter.update(detection.bbox);
    this.velocity = this.filter.getVelocity();
  }

  /**
   * Mark as unmatched
   */
  markMissed(): void {
    this.hitStreak = 0;
  }

  /**
   * Convert to TrackedObject
   */
  toTrackedObject(): TrackedObject {
    return {
      id: this.id,
      class: this.class,
      bbox: this.bbox,
      confidence: this.confidence,
      age: this.age,
      hits: this.hits,
      velocity: this.velocity,
    };
  }
}

// ============================================================================
// Object Tracker Class (SORT Algorithm)
// ============================================================================

export class ObjectTracker {
  private tracks: Track[];
  private nextId: number;
  private config: TrackingConfig;
  private frameCount: number;

  constructor(config?: Partial<TrackingConfig>) {
    console.log('[ObjectTracker] Initializing tracker...');

    // Default configuration
    this.config = {
      maxAge: config?.maxAge || 30,
      minHits: config?.minHits || 3,
      iouThreshold: config?.iouThreshold || 0.3,
    };

    this.tracks = [];
    this.nextId = 1;
    this.frameCount = 0;

    console.log('  ✓ Object tracker initialized');
    console.log(`  Max age: ${this.config.maxAge} frames`);
    console.log(`  Min hits: ${this.config.minHits}`);
    console.log(`  IoU threshold: ${this.config.iouThreshold}`);
  }

  /**
   * Update tracker with new detections
   *
   * This is the main SORT algorithm implementation
   */
  update(detections: DetectionResult[]): TrackedObject[] {
    this.frameCount += 1;

    // Predict new locations for existing tracks
    for (const track of this.tracks) {
      track.predict();
    }

    // Match detections to tracks using IoU
    const { matched, unmatchedDetections, unmatchedTracks } =
      this.associateDetectionsToTracks(detections);

    // Update matched tracks
    for (const [trackIdx, detIdx] of matched) {
      this.tracks[trackIdx].update(detections[detIdx]);
    }

    // Create new tracks for unmatched detections
    for (const detIdx of unmatchedDetections) {
      const track = new Track(detections[detIdx], this.nextId);
      this.tracks.push(track);
      this.nextId += 1;
    }

    // Mark unmatched tracks as missed
    for (const trackIdx of unmatchedTracks) {
      this.tracks[trackIdx].markMissed();
    }

    // Remove dead tracks
    this.tracks = this.tracks.filter(track => {
      // Remove if too old without updates
      if (track.timeSinceUpdate > this.config.maxAge) {
        return false;
      }
      return true;
    });

    // Return confirmed tracks
    const confirmedTracks = this.tracks.filter(track => {
      // Track must have enough hits or be recently updated
      return track.hits >= this.config.minHits || track.timeSinceUpdate === 0;
    });

    return confirmedTracks.map(track => track.toTrackedObject());
  }

  /**
   * Associate detections to tracks using IoU matching
   */
  private associateDetectionsToTracks(detections: DetectionResult[]): {
    matched: [number, number][];
    unmatchedDetections: number[];
    unmatchedTracks: number[];
  } {
    if (this.tracks.length === 0) {
      return {
        matched: [],
        unmatchedDetections: Array.from({ length: detections.length }, (_, i) => i),
        unmatchedTracks: [],
      };
    }

    if (detections.length === 0) {
      return {
        matched: [],
        unmatchedDetections: [],
        unmatchedTracks: Array.from({ length: this.tracks.length }, (_, i) => i),
      };
    }

    // Compute IoU matrix
    const iouMatrix: number[][] = [];

    for (const track of this.tracks) {
      const row: number[] = [];
      for (const detection of detections) {
        const iou = this.calculateIoU(track.bbox, detection.bbox);
        row.push(iou);
      }
      iouMatrix.push(row);
    }

    // Perform Hungarian algorithm (greedy approximation)
    const matched: [number, number][] = [];
    const unmatchedDetections = new Set(Array.from({ length: detections.length }, (_, i) => i));
    const unmatchedTracks = new Set(Array.from({ length: this.tracks.length }, (_, i) => i));

    // Greedy matching: sort by IoU and match best pairs
    const matches: { trackIdx: number; detIdx: number; iou: number }[] = [];

    for (let trackIdx = 0; trackIdx < iouMatrix.length; trackIdx++) {
      for (let detIdx = 0; detIdx < iouMatrix[trackIdx].length; detIdx++) {
        const iou = iouMatrix[trackIdx][detIdx];
        if (iou >= this.config.iouThreshold) {
          matches.push({ trackIdx, detIdx, iou });
        }
      }
    }

    // Sort by IoU descending
    matches.sort((a, b) => b.iou - a.iou);

    // Match greedily
    for (const match of matches) {
      if (unmatchedTracks.has(match.trackIdx) && unmatchedDetections.has(match.detIdx)) {
        matched.push([match.trackIdx, match.detIdx]);
        unmatchedTracks.delete(match.trackIdx);
        unmatchedDetections.delete(match.detIdx);
      }
    }

    return {
      matched,
      unmatchedDetections: Array.from(unmatchedDetections),
      unmatchedTracks: Array.from(unmatchedTracks),
    };
  }

  /**
   * Calculate Intersection over Union (IoU) between two bounding boxes
   */
  private calculateIoU(bbox1: BoundingBox, bbox2: BoundingBox): number {
    const x1 = Math.max(bbox1.x, bbox2.x);
    const y1 = Math.max(bbox1.y, bbox2.y);
    const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
    const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);

    const area1 = bbox1.width * bbox1.height;
    const area2 = bbox2.width * bbox2.height;
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Visualize tracked objects on an image
   */
  visualize(
    image: ImageData | string,
    trackedObjects: TrackedObject[],
    outputPath?: string
  ): ImageData {
    let imgData: any;

    if (typeof image === 'string') {
      imgData = cv2.imread(image);
    } else {
      imgData = image.data.copy();
    }

    for (const obj of trackedObjects) {
      const { id, class: className, bbox, confidence, velocity } = obj;

      // Generate color based on track ID
      const color = this.getTrackColor(id);

      // Draw bounding box
      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y + bbox.height],
        color,
        2
      );

      // Draw track ID and class
      const label = `ID:${id} ${className} ${(confidence * 100).toFixed(0)}%`;
      const [labelWidth, labelHeight] = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        2
      )[0];

      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y - labelHeight - 10],
        [bbox.x + labelWidth, bbox.y],
        color,
        -1
      );

      cv2.putText(
        imgData,
        label,
        [bbox.x, bbox.y - 5],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        [255, 255, 255],
        2
      );

      // Draw velocity arrow if available
      if (velocity && (Math.abs(velocity.vx) > 0.1 || Math.abs(velocity.vy) > 0.1)) {
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        const arrowEndX = Math.round(centerX + velocity.vx * 10);
        const arrowEndY = Math.round(centerY + velocity.vy * 10);

        cv2.arrowedLine(
          imgData,
          [Math.round(centerX), Math.round(centerY)],
          [arrowEndX, arrowEndY],
          color,
          2,
          { tipLength: 0.3 }
        );
      }

      // Draw track trail (small circle at center)
      const centerX = Math.round(bbox.x + bbox.width / 2);
      const centerY = Math.round(bbox.y + bbox.height / 2);
      cv2.circle(imgData, [centerX, centerY], 3, color, -1);
    }

    // Add tracking info
    const infoText = `Frame: ${this.frameCount} | Tracks: ${trackedObjects.length}`;
    cv2.putText(
      imgData,
      infoText,
      [10, 30],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.7,
      [0, 255, 0],
      2
    );

    if (outputPath) {
      cv2.imwrite(outputPath, imgData);
    }

    return {
      data: imgData,
      width: imgData.shape[1],
      height: imgData.shape[0],
      channels: imgData.shape[2],
      dtype: String(imgData.dtype),
    };
  }

  /**
   * Get consistent color for track ID
   */
  private getTrackColor(trackId: number): [number, number, number] {
    const hue = (trackId * 67) % 180;
    const color = cv2.cvtColor(
      numpy.uint8([[[hue, 255, 255]]]),
      cv2.COLOR_HSV2BGR
    )[0][0];

    return [Number(color[0]), Number(color[1]), Number(color[2])];
  }

  /**
   * Get active tracks
   */
  getActiveTracks(): TrackedObject[] {
    return this.tracks
      .filter(track => track.timeSinceUpdate === 0)
      .map(track => track.toTrackedObject());
  }

  /**
   * Get all tracks (including tentative)
   */
  getAllTracks(): TrackedObject[] {
    return this.tracks.map(track => track.toTrackedObject());
  }

  /**
   * Get track by ID
   */
  getTrackById(id: number): TrackedObject | null {
    const track = this.tracks.find(t => t.id === id);
    return track ? track.toTrackedObject() : null;
  }

  /**
   * Get tracking statistics
   */
  getStatistics(): {
    totalTracks: number;
    activeTracks: number;
    tentativeTracks: number;
    frameCount: number;
    averageAge: number;
    averageHits: number;
  } {
    const activeTracks = this.tracks.filter(t => t.timeSinceUpdate === 0).length;
    const tentativeTracks = this.tracks.filter(t => t.hits < this.config.minHits).length;

    const totalAge = this.tracks.reduce((sum, t) => sum + t.age, 0);
    const totalHits = this.tracks.reduce((sum, t) => sum + t.hits, 0);

    return {
      totalTracks: this.tracks.length,
      activeTracks,
      tentativeTracks,
      frameCount: this.frameCount,
      averageAge: this.tracks.length > 0 ? totalAge / this.tracks.length : 0,
      averageHits: this.tracks.length > 0 ? totalHits / this.tracks.length : 0,
    };
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.tracks = [];
    this.nextId = 1;
    this.frameCount = 0;
    console.log('[ObjectTracker] Tracker reset');
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TrackingConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    console.log('[ObjectTracker] Configuration updated:', this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): TrackingConfig {
    return { ...this.config };
  }

  /**
   * Filter tracks by class
   */
  filterByClass(trackedObjects: TrackedObject[], classes: string[]): TrackedObject[] {
    return trackedObjects.filter(obj => classes.includes(obj.class));
  }

  /**
   * Filter tracks by confidence
   */
  filterByConfidence(trackedObjects: TrackedObject[], minConfidence: number): TrackedObject[] {
    return trackedObjects.filter(obj => obj.confidence >= minConfidence);
  }

  /**
   * Get track history
   */
  getTrackHistory(trackId: number): BoundingBox[] | null {
    // Note: In a full implementation, we would store history
    // For now, return current position
    const track = this.tracks.find(t => t.id === trackId);
    return track ? [track.bbox] : null;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Track objects in a sequence of detections
 */
export function trackObjects(
  detectionSequence: DetectionResult[][],
  config?: Partial<TrackingConfig>
): TrackedObject[][] {
  const tracker = new ObjectTracker(config);
  const results: TrackedObject[][] = [];

  for (const detections of detectionSequence) {
    const tracked = tracker.update(detections);
    results.push(tracked);
  }

  return results;
}

/**
 * Track objects in video file
 */
export async function trackVideo(
  videoPath: string,
  detectFunc: (frame: ImageData) => Promise<DetectionResult[]>,
  outputPath?: string,
  config?: Partial<TrackingConfig>
): Promise<TrackedObject[][]> {
  console.log(`[ObjectTracker] Processing video: ${videoPath}`);

  const tracker = new ObjectTracker(config);
  const results: TrackedObject[][] = [];

  // Open video
  const cap = cv2.VideoCapture(videoPath);
  const fps = Number(cap.get(cv2.CAP_PROP_FPS));
  const width = Number(cap.get(cv2.CAP_PROP_FRAME_WIDTH));
  const height = Number(cap.get(cv2.CAP_PROP_FRAME_HEIGHT));
  const totalFrames = Number(cap.get(cv2.CAP_PROP_FRAME_COUNT));

  console.log(`  Resolution: ${width}x${height}`);
  console.log(`  FPS: ${fps}`);
  console.log(`  Total frames: ${totalFrames}`);

  // Create video writer if output path provided
  let writer: any = null;
  if (outputPath) {
    const fourcc = cv2.VideoWriter_fourcc('m', 'p', '4', 'v');
    writer = cv2.VideoWriter(outputPath, fourcc, fps, [width, height]);
  }

  let frameCount = 0;

  while (true) {
    const [ret, frame] = cap.read();

    if (!ret) {
      break;
    }

    frameCount += 1;

    // Detect objects in frame
    const imageData: ImageData = {
      data: frame,
      width,
      height,
      channels: 3,
      dtype: String(frame.dtype),
    };

    const detections = await detectFunc(imageData);

    // Update tracker
    const tracked = tracker.update(detections);
    results.push(tracked);

    // Visualize and write
    if (writer) {
      const visualized = tracker.visualize(imageData, tracked);
      writer.write(visualized.data);
    }

    if (frameCount % 30 === 0) {
      console.log(`  Processed ${frameCount}/${totalFrames} frames`);
    }
  }

  cap.release();
  if (writer) {
    writer.release();
    console.log(`  Saved output to ${outputPath}`);
  }

  console.log('[ObjectTracker] Video processing complete');

  return results;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎯 Object Tracking Demo\n');

  // Create tracker
  const tracker = new ObjectTracker({
    maxAge: 30,
    minHits: 3,
    iouThreshold: 0.3,
  });

  console.log('\n📊 Tracker Info:', tracker.getConfig());

  // Simulate object detections across frames
  console.log('\n🎬 Simulating object tracking...');

  const frames = 50;
  const allTracked: TrackedObject[][] = [];

  for (let i = 0; i < frames; i++) {
    // Simulate moving objects
    const detections: DetectionResult[] = [];

    // Object 1: Moving right
    if (i < 40) {
      detections.push({
        class: 'person',
        classId: 0,
        confidence: 0.9,
        bbox: {
          x: 100 + i * 5,
          y: 200,
          width: 50,
          height: 100,
        },
      });
    }

    // Object 2: Moving down
    if (i < 35) {
      detections.push({
        class: 'car',
        classId: 2,
        confidence: 0.85,
        bbox: {
          x: 300,
          y: 100 + i * 3,
          width: 80,
          height: 60,
        },
      });
    }

    // Object 3: Appears later
    if (i > 20 && i < 45) {
      detections.push({
        class: 'person',
        classId: 0,
        confidence: 0.8,
        bbox: {
          x: 400,
          y: 250 + (i - 20) * 2,
          width: 45,
          height: 95,
        },
      });
    }

    // Update tracker
    const tracked = tracker.update(detections);
    allTracked.push(tracked);

    if ((i + 1) % 10 === 0) {
      console.log(`  Frame ${i + 1}/${frames}: ${tracked.length} tracks`);
    }
  }

  console.log('\n📈 Tracking Results:');
  const stats = tracker.getStatistics();
  console.log(`  Total frames: ${stats.frameCount}`);
  console.log(`  Active tracks: ${stats.activeTracks}`);
  console.log(`  Average age: ${stats.averageAge.toFixed(1)} frames`);
  console.log(`  Average hits: ${stats.averageHits.toFixed(1)}`);

  // Count unique tracks
  const uniqueIds = new Set<number>();
  for (const tracked of allTracked) {
    for (const obj of tracked) {
      uniqueIds.add(obj.id);
    }
  }
  console.log(`  Unique objects tracked: ${uniqueIds.size}`);

  console.log('\n✅ Object tracking demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - SORT tracking algorithm in TypeScript');
  console.log('   - Kalman filter motion prediction');
  console.log('   - IoU-based data association');
  console.log('   - Multi-object tracking across frames');
  console.log('   - All in one process with Elide!');
}
