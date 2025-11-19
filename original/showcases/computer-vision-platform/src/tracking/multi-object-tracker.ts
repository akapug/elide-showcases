/**
 * Multi-Object Tracker - Advanced Tracking System in TypeScript!
 *
 * Demonstrates:
 * - python:cv2 for visualization and video processing
 * - python:numpy for numerical operations
 * - Track lifecycle management (creation, update, deletion)
 * - Multi-class object tracking
 *
 * This is ONLY possible with Elide's polyglot runtime!
 */

// @ts-ignore - OpenCV for visualization
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
// Track State Enumeration
// ============================================================================

enum TrackState {
  Tentative = 'tentative',  // New track, not yet confirmed
  Confirmed = 'confirmed',  // Track confirmed with enough hits
  Deleted = 'deleted',      // Track marked for deletion
}

// ============================================================================
// Track with Advanced State Management
// ============================================================================

class ManagedTrack {
  id: number;
  class: string;
  bbox: BoundingBox;
  confidence: number;
  state: TrackState;
  age: number;
  hits: number;
  hitStreak: number;
  timeSinceUpdate: number;
  features: number[];
  history: BoundingBox[];
  maxHistoryLength: number;

  constructor(detection: DetectionResult, trackId: number) {
    this.id = trackId;
    this.class = detection.class;
    this.bbox = detection.bbox;
    this.confidence = detection.confidence;
    this.state = TrackState.Tentative;
    this.age = 1;
    this.hits = 1;
    this.hitStreak = 1;
    this.timeSinceUpdate = 0;
    this.features = [];
    this.history = [{ ...detection.bbox }];
    this.maxHistoryLength = 30;
  }

  /**
   * Update track with new detection
   */
  update(detection: DetectionResult): void {
    this.bbox = detection.bbox;
    this.confidence = detection.confidence;
    this.hits += 1;
    this.hitStreak += 1;
    this.timeSinceUpdate = 0;

    // Add to history
    this.history.push({ ...detection.bbox });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Predict next position (simple linear motion model)
   */
  predict(): void {
    if (this.history.length >= 2) {
      // Calculate velocity from last two positions
      const current = this.history[this.history.length - 1];
      const previous = this.history[this.history.length - 2];

      const dx = current.x - previous.x;
      const dy = current.y - previous.y;

      // Update position
      this.bbox = {
        x: this.bbox.x + dx,
        y: this.bbox.y + dy,
        width: this.bbox.width,
        height: this.bbox.height,
      };
    }

    this.age += 1;
    this.timeSinceUpdate += 1;
  }

  /**
   * Mark as missed detection
   */
  markMissed(): void {
    this.hitStreak = 0;
  }

  /**
   * Check if track should be confirmed
   */
  shouldConfirm(minHits: number): boolean {
    return this.hits >= minHits && this.state === TrackState.Tentative;
  }

  /**
   * Check if track should be deleted
   */
  shouldDelete(maxAge: number): boolean {
    return this.timeSinceUpdate > maxAge;
  }

  /**
   * Get velocity estimate
   */
  getVelocity(): { vx: number; vy: number } {
    if (this.history.length >= 2) {
      const current = this.history[this.history.length - 1];
      const previous = this.history[this.history.length - 2];

      return {
        vx: current.x - previous.x,
        vy: current.y - previous.y,
      };
    }

    return { vx: 0, vy: 0 };
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
      velocity: this.getVelocity(),
    };
  }
}

// ============================================================================
// Multi-Object Tracker Class
// ============================================================================

export class MultiObjectTracker {
  private tracks: Map<number, ManagedTrack>;
  private nextId: number;
  private config: TrackingConfig;
  private frameCount: number;
  private trackHistory: Map<number, TrackedObject[]>;

  constructor(config?: Partial<TrackingConfig>) {
    console.log('[MultiObjectTracker] Initializing tracker...');

    // Default configuration
    this.config = {
      maxAge: config?.maxAge || 30,
      minHits: config?.minHits || 3,
      iouThreshold: config?.iouThreshold || 0.3,
    };

    this.tracks = new Map();
    this.nextId = 1;
    this.frameCount = 0;
    this.trackHistory = new Map();

    console.log('  ✓ Multi-object tracker initialized');
    console.log(`  Max age: ${this.config.maxAge} frames`);
    console.log(`  Min hits: ${this.config.minHits}`);
    console.log(`  IoU threshold: ${this.config.iouThreshold}`);
  }

  /**
   * Update tracker with new detections
   */
  update(detections: DetectionResult[]): TrackedObject[] {
    this.frameCount += 1;

    // Predict new locations for existing tracks
    for (const track of this.tracks.values()) {
      track.predict();
    }

    // Match detections to tracks
    const { matched, unmatchedDetections, unmatchedTracks } =
      this.matchDetectionsToTracks(detections);

    // Update matched tracks
    for (const [trackId, detIdx] of matched) {
      const track = this.tracks.get(trackId)!;
      track.update(detections[detIdx]);

      // Confirm track if it meets criteria
      if (track.shouldConfirm(this.config.minHits)) {
        track.state = TrackState.Confirmed;
      }
    }

    // Mark unmatched tracks as missed
    for (const trackId of unmatchedTracks) {
      const track = this.tracks.get(trackId)!;
      track.markMissed();
    }

    // Create new tracks for unmatched detections
    for (const detIdx of unmatchedDetections) {
      this.createTrack(detections[detIdx]);
    }

    // Delete old tracks
    this.deleteTracks();

    // Get active tracks
    const activeTracks = this.getConfirmedTracks();

    // Update track history
    for (const track of activeTracks) {
      if (!this.trackHistory.has(track.id)) {
        this.trackHistory.set(track.id, []);
      }
      this.trackHistory.get(track.id)!.push({ ...track });
    }

    return activeTracks;
  }

  /**
   * Create a new track
   */
  private createTrack(detection: DetectionResult): void {
    const track = new ManagedTrack(detection, this.nextId);
    this.tracks.set(this.nextId, track);
    this.nextId += 1;
  }

  /**
   * Delete old tracks
   */
  private deleteTracks(): void {
    const toDelete: number[] = [];

    for (const [id, track] of this.tracks.entries()) {
      if (track.shouldDelete(this.config.maxAge)) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.tracks.delete(id);
    }
  }

  /**
   * Match detections to tracks
   */
  private matchDetectionsToTracks(detections: DetectionResult[]): {
    matched: [number, number][];
    unmatchedDetections: number[];
    unmatchedTracks: number[];
  } {
    const trackIds = Array.from(this.tracks.keys());

    if (trackIds.length === 0) {
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
        unmatchedTracks: trackIds,
      };
    }

    // Compute cost matrix (1 - IoU)
    const costMatrix: number[][] = [];

    for (const trackId of trackIds) {
      const track = this.tracks.get(trackId)!;
      const row: number[] = [];

      for (const detection of detections) {
        const iou = this.calculateIoU(track.bbox, detection.bbox);
        const cost = 1 - iou;
        row.push(cost);
      }

      costMatrix.push(row);
    }

    // Perform greedy matching
    const matched: [number, number][] = [];
    const unmatchedDetections = new Set(Array.from({ length: detections.length }, (_, i) => i));
    const unmatchedTracks = new Set(trackIds);

    // Create list of (trackId, detIdx, cost) tuples
    const matches: { trackId: number; detIdx: number; cost: number }[] = [];

    for (let trackIdx = 0; trackIdx < trackIds.length; trackIdx++) {
      const trackId = trackIds[trackIdx];
      for (let detIdx = 0; detIdx < detections.length; detIdx++) {
        const cost = costMatrix[trackIdx][detIdx];
        const iou = 1 - cost;

        if (iou >= this.config.iouThreshold) {
          matches.push({ trackId, detIdx, cost });
        }
      }
    }

    // Sort by cost ascending (higher IoU first)
    matches.sort((a, b) => a.cost - b.cost);

    // Match greedily
    for (const match of matches) {
      if (unmatchedTracks.has(match.trackId) && unmatchedDetections.has(match.detIdx)) {
        matched.push([match.trackId, match.detIdx]);
        unmatchedTracks.delete(match.trackId);
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
   * Calculate IoU between two bounding boxes
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
   * Get confirmed tracks
   */
  private getConfirmedTracks(): TrackedObject[] {
    const confirmed: TrackedObject[] = [];

    for (const track of this.tracks.values()) {
      if (track.state === TrackState.Confirmed) {
        confirmed.push(track.toTrackedObject());
      }
    }

    return confirmed;
  }

  /**
   * Visualize tracked objects with trails
   */
  visualize(
    image: ImageData | string,
    trackedObjects: TrackedObject[],
    showTrails: boolean = true,
    outputPath?: string
  ): ImageData {
    let imgData: any;

    if (typeof image === 'string') {
      imgData = cv2.imread(image);
    } else {
      imgData = image.data.copy();
    }

    // Draw trails first (behind boxes)
    if (showTrails) {
      for (const obj of trackedObjects) {
        const history = this.trackHistory.get(obj.id);

        if (history && history.length > 1) {
          const color = this.getTrackColor(obj.id);

          // Draw trail as connected points
          for (let i = 1; i < Math.min(history.length, 20); i++) {
            const prev = history[history.length - i - 1];
            const curr = history[history.length - i];

            const prevCenter = {
              x: Math.round(prev.bbox.x + prev.bbox.width / 2),
              y: Math.round(prev.bbox.y + prev.bbox.height / 2),
            };

            const currCenter = {
              x: Math.round(curr.bbox.x + curr.bbox.width / 2),
              y: Math.round(curr.bbox.y + curr.bbox.height / 2),
            };

            // Fade trail (older = more transparent)
            const alpha = 1 - (i / 20);
            const thickness = Math.max(1, Math.round(3 * alpha));

            cv2.line(
              imgData,
              [prevCenter.x, prevCenter.y],
              [currCenter.x, currCenter.y],
              color,
              thickness
            );
          }
        }
      }
    }

    // Draw bounding boxes and labels
    for (const obj of trackedObjects) {
      const { id, class: className, bbox, confidence } = obj;
      const color = this.getTrackColor(id);

      // Draw bounding box
      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y + bbox.height],
        color,
        3
      );

      // Draw label with track info
      const label = `#${id} ${className} ${(confidence * 100).toFixed(0)}%`;
      const [labelWidth, labelHeight] = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        2
      )[0];

      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y - labelHeight - 12],
        [bbox.x + labelWidth + 8, bbox.y],
        color,
        -1
      );

      cv2.putText(
        imgData,
        label,
        [bbox.x + 4, bbox.y - 6],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        [255, 255, 255],
        2
      );

      // Draw center point
      const centerX = Math.round(bbox.x + bbox.width / 2);
      const centerY = Math.round(bbox.y + bbox.height / 2);
      cv2.circle(imgData, [centerX, centerY], 5, color, -1);
    }

    // Add info overlay
    this.drawInfoOverlay(imgData, trackedObjects);

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
   * Draw information overlay
   */
  private drawInfoOverlay(image: any, trackedObjects: TrackedObject[]): void {
    const height = image.shape[0];
    const width = image.shape[1];

    // Draw semi-transparent background
    const overlayHeight = 120;
    const overlay = image[0:overlayHeight, 0:250].copy();
    cv2.rectangle(image, [0, 0], [250, overlayHeight], [0, 0, 0], -1);
    cv2.addWeighted(overlay, 0.3, image[0:overlayHeight, 0:250], 0.7, 0, image[0:overlayHeight, 0:250]);

    // Draw text
    cv2.putText(
      image,
      `Frame: ${this.frameCount}`,
      [10, 25],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.6,
      [255, 255, 255],
      2
    );

    cv2.putText(
      image,
      `Active Tracks: ${trackedObjects.length}`,
      [10, 50],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.6,
      [0, 255, 0],
      2
    );

    cv2.putText(
      image,
      `Total Tracks: ${this.tracks.size}`,
      [10, 75],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.6,
      [255, 255, 0],
      2
    );

    // Count by class
    const classCounts = new Map<string, number>();
    for (const obj of trackedObjects) {
      classCounts.set(obj.class, (classCounts.get(obj.class) || 0) + 1);
    }

    const classText = Array.from(classCounts.entries())
      .map(([cls, count]) => `${cls}:${count}`)
      .join(', ');

    cv2.putText(
      image,
      classText.slice(0, 30),
      [10, 100],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.5,
      [200, 200, 200],
      1
    );
  }

  /**
   * Get consistent color for track ID
   */
  private getTrackColor(trackId: number): [number, number, number] {
    const hue = (trackId * 73) % 180;
    const color = cv2.cvtColor(
      numpy.uint8([[[hue, 255, 255]]]),
      cv2.COLOR_HSV2BGR
    )[0][0];

    return [Number(color[0]), Number(color[1]), Number(color[2])];
  }

  /**
   * Get track history
   */
  getTrackHistory(trackId: number): TrackedObject[] | null {
    return this.trackHistory.get(trackId) || null;
  }

  /**
   * Get all track histories
   */
  getAllTrackHistories(): Map<number, TrackedObject[]> {
    return new Map(this.trackHistory);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    frameCount: number;
    totalTracks: number;
    confirmedTracks: number;
    tentativeTracks: number;
    uniqueTracksEver: number;
    averageTrackLength: number;
  } {
    let confirmedCount = 0;
    let tentativeCount = 0;

    for (const track of this.tracks.values()) {
      if (track.state === TrackState.Confirmed) {
        confirmedCount += 1;
      } else if (track.state === TrackState.Tentative) {
        tentativeCount += 1;
      }
    }

    // Calculate average track length
    let totalLength = 0;
    for (const history of this.trackHistory.values()) {
      totalLength += history.length;
    }

    const avgLength = this.trackHistory.size > 0 ? totalLength / this.trackHistory.size : 0;

    return {
      frameCount: this.frameCount,
      totalTracks: this.tracks.size,
      confirmedTracks: confirmedCount,
      tentativeTracks: tentativeCount,
      uniqueTracksEver: this.trackHistory.size,
      averageTrackLength: avgLength,
    };
  }

  /**
   * Filter tracks by class
   */
  filterByClass(trackedObjects: TrackedObject[], classes: string[]): TrackedObject[] {
    return trackedObjects.filter(obj => classes.includes(obj.class));
  }

  /**
   * Filter tracks by age
   */
  filterByAge(trackedObjects: TrackedObject[], minAge: number): TrackedObject[] {
    return trackedObjects.filter(obj => obj.age >= minAge);
  }

  /**
   * Get track by ID
   */
  getTrack(id: number): TrackedObject | null {
    const track = this.tracks.get(id);
    return track ? track.toTrackedObject() : null;
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.tracks.clear();
    this.trackHistory.clear();
    this.nextId = 1;
    this.frameCount = 0;
    console.log('[MultiObjectTracker] Tracker reset');
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TrackingConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    console.log('[MultiObjectTracker] Configuration updated:', this.config);
  }

  /**
   * Get configuration
   */
  getConfig(): TrackingConfig {
    return { ...this.config };
  }

  /**
   * Export track data
   */
  exportTracks(): {
    frameCount: number;
    tracks: Map<number, TrackedObject[]>;
  } {
    return {
      frameCount: this.frameCount,
      tracks: new Map(this.trackHistory),
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Track multiple objects across frames
 */
export function trackMultipleObjects(
  detectionSequence: DetectionResult[][],
  config?: Partial<TrackingConfig>
): TrackedObject[][] {
  const tracker = new MultiObjectTracker(config);
  const results: TrackedObject[][] = [];

  for (const detections of detectionSequence) {
    const tracked = tracker.update(detections);
    results.push(tracked);
  }

  return results;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎯 Multi-Object Tracking Demo\n');

  // Create tracker
  const tracker = new MultiObjectTracker({
    maxAge: 20,
    minHits: 3,
    iouThreshold: 0.3,
  });

  console.log('\n📊 Tracker Configuration:', tracker.getConfig());

  // Simulate tracking across multiple frames
  console.log('\n🎬 Simulating multi-object tracking...');

  const frames = 100;

  for (let i = 0; i < frames; i++) {
    const detections: DetectionResult[] = [];

    // Simulate multiple moving objects with different patterns

    // Object 1: Moves diagonally
    if (i < 80) {
      detections.push({
        class: 'person',
        classId: 0,
        confidence: 0.9 - Math.random() * 0.1,
        bbox: {
          x: 50 + i * 3,
          y: 50 + i * 2,
          width: 50 + Math.round(Math.random() * 5),
          height: 100 + Math.round(Math.random() * 5),
        },
      });
    }

    // Object 2: Moves horizontally
    if (i > 10 && i < 90) {
      detections.push({
        class: 'car',
        classId: 2,
        confidence: 0.85 - Math.random() * 0.1,
        bbox: {
          x: 200 + (i - 10) * 4,
          y: 300,
          width: 80 + Math.round(Math.random() * 5),
          height: 60 + Math.round(Math.random() * 5),
        },
      });
    }

    // Object 3: Appears and disappears
    if ((i > 20 && i < 40) || (i > 60 && i < 85)) {
      detections.push({
        class: 'bicycle',
        classId: 1,
        confidence: 0.8 - Math.random() * 0.1,
        bbox: {
          x: 400,
          y: 100 + i * 2,
          width: 40 + Math.round(Math.random() * 5),
          height: 60 + Math.round(Math.random() * 5),
        },
      });
    }

    // Object 4: Stationary
    if (i > 30) {
      detections.push({
        class: 'person',
        classId: 0,
        confidence: 0.88 - Math.random() * 0.1,
        bbox: {
          x: 500,
          y: 400,
          width: 45 + Math.round(Math.random() * 3),
          height: 95 + Math.round(Math.random() * 3),
        },
      });
    }

    // Update tracker
    const tracked = tracker.update(detections);

    if ((i + 1) % 20 === 0) {
      console.log(`  Frame ${i + 1}/${frames}: ${tracked.length} confirmed tracks`);
    }
  }

  // Get statistics
  console.log('\n📈 Tracking Statistics:');
  const stats = tracker.getStatistics();
  console.log(`  Total frames processed: ${stats.frameCount}`);
  console.log(`  Active tracks: ${stats.totalTracks}`);
  console.log(`  Confirmed tracks: ${stats.confirmedTracks}`);
  console.log(`  Tentative tracks: ${stats.tentativeTracks}`);
  console.log(`  Unique tracks (all time): ${stats.uniqueTracksEver}`);
  console.log(`  Average track length: ${stats.averageTrackLength.toFixed(1)} frames`);

  // Analyze track histories
  console.log('\n📊 Track Histories:');
  const histories = tracker.getAllTrackHistories();
  for (const [trackId, history] of histories.entries()) {
    if (history.length > 10) {
      const firstFrame = history[0];
      const lastFrame = history[history.length - 1];
      console.log(`  Track #${trackId} (${firstFrame.class}):`);
      console.log(`    Duration: ${history.length} frames`);
      console.log(`    Avg confidence: ${(history.reduce((s, t) => s + t.confidence, 0) / history.length * 100).toFixed(1)}%`);
    }
  }

  console.log('\n✅ Multi-object tracking demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - Multi-object tracking with state management');
  console.log('   - Track lifecycle (tentative, confirmed, deleted)');
  console.log('   - Track history and trajectory analysis');
  console.log('   - Advanced visualization with trails');
  console.log('   - All in one process with Elide!');
}
