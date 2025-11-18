/**
 * Object Tracking Module
 *
 * Real-time object detection and tracking with multiple algorithms
 * and motion prediction.
 */

import { EventEmitter } from 'events';

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
 * Bounding box
 */
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tracked object
 */
interface TrackedObject {
  id: number;
  label: string;
  bbox: BoundingBox;
  confidence: number;
  velocity?: { x: number; y: number };
  trail?: Point[];
  age: number;
  state: 'active' | 'lost' | 'occluded';
}

/**
 * 2D Point
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Detection result
 */
interface Detection {
  label: string;
  bbox: BoundingBox;
  confidence: number;
}

/**
 * Tracker configuration
 */
interface TrackerConfig {
  algorithm?: 'kcf' | 'csrt' | 'mosse' | 'medianflow';
  maxObjects?: number;
  minConfidence?: number;
  trackingQuality?: 'low' | 'medium' | 'high';
  enableMotionPrediction?: boolean;
  maxTrailLength?: number;
}

/**
 * Kalman filter for motion prediction
 */
class KalmanFilter {
  private state: number[];
  private covariance: number[][];
  private processNoise: number;
  private measurementNoise: number;

  constructor(processNoise = 0.1, measurementNoise = 1.0) {
    this.state = [0, 0, 0, 0]; // [x, y, vx, vy]
    this.covariance = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  /**
   * Predict next state
   */
  predict(dt: number = 1): Point {
    // State transition matrix
    const F = [
      [1, 0, dt, 0],
      [0, 1, 0, dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    // Predict state
    this.state = this.matrixVectorMultiply(F, this.state);

    // Predict covariance
    const Ft = this.transpose(F);
    const FP = this.matrixMultiply(F, this.covariance);
    this.covariance = this.matrixAdd(
      this.matrixMultiply(FP, Ft),
      this.identityMatrix(4, this.processNoise)
    );

    return { x: this.state[0], y: this.state[1] };
  }

  /**
   * Update with measurement
   */
  update(measurement: Point): void {
    // Measurement matrix
    const H = [
      [1, 0, 0, 0],
      [0, 1, 0, 0]
    ];

    // Measurement vector
    const z = [measurement.x, measurement.y];

    // Innovation
    const Hx = this.matrixVectorMultiply(H, this.state);
    const y = [z[0] - Hx[0], z[1] - Hx[1]];

    // Innovation covariance
    const Ht = this.transpose(H);
    const HP = this.matrixMultiply(H, this.covariance);
    const S = this.matrixAdd(
      this.matrixMultiply(HP, Ht),
      this.identityMatrix(2, this.measurementNoise)
    );

    // Kalman gain
    const Sinv = this.invert2x2(S);
    const K = this.matrixMultiply(this.matrixMultiply(this.covariance, Ht), Sinv);

    // Update state
    const Ky = this.matrixVectorMultiply(K, y);
    this.state = [
      this.state[0] + Ky[0],
      this.state[1] + Ky[1],
      this.state[2] + Ky[2],
      this.state[3] + Ky[3]
    ];

    // Update covariance
    const KH = this.matrixMultiply(K, H);
    const I_KH = this.matrixSubtract(this.identityMatrix(4, 1), KH);
    this.covariance = this.matrixMultiply(I_KH, this.covariance);
  }

  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < A[0].length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < A.length; i++) {
      let sum = 0;
      for (let j = 0; j < v.length; j++) {
        sum += A[i][j] * v[j];
      }
      result[i] = sum;
    }
    return result;
  }

  private matrixAdd(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < A[0].length; j++) {
        result[i][j] = A[i][j] + B[i][j];
      }
    }
    return result;
  }

  private matrixSubtract(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < A[0].length; j++) {
        result[i][j] = A[i][j] - B[i][j];
      }
    }
    return result;
  }

  private transpose(A: number[][]): number[][] {
    const result: number[][] = [];
    for (let j = 0; j < A[0].length; j++) {
      result[j] = [];
      for (let i = 0; i < A.length; i++) {
        result[j][i] = A[i][j];
      }
    }
    return result;
  }

  private identityMatrix(size: number, scale: number = 1): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < size; i++) {
      result[i] = [];
      for (let j = 0; j < size; j++) {
        result[i][j] = i === j ? scale : 0;
      }
    }
    return result;
  }

  private invert2x2(A: number[][]): number[][] {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det]
    ];
  }
}

/**
 * Object tracker class
 */
export class ObjectTracker extends EventEmitter {
  private config: TrackerConfig;
  private trackedObjects: Map<number, TrackedObject> = new Map();
  private objectIdCounter: number = 0;
  private kalmanFilters: Map<number, KalmanFilter> = new Map();
  private previousFrame: Buffer | null = null;
  private frameHistory: FrameData[] = [];

  constructor(config: TrackerConfig = {}) {
    super();

    this.config = {
      algorithm: 'kcf',
      maxObjects: 10,
      minConfidence: 0.5,
      trackingQuality: 'medium',
      enableMotionPrediction: true,
      maxTrailLength: 30,
      ...config
    };
  }

  /**
   * Initialize tracker with bounding box
   */
  initTracker(frame: FrameData, bbox: BoundingBox, label: string = 'object'): number {
    const objectId = this.objectIdCounter++;

    const trackedObject: TrackedObject = {
      id: objectId,
      label,
      bbox,
      confidence: 1.0,
      velocity: { x: 0, y: 0 },
      trail: [],
      age: 0,
      state: 'active'
    };

    this.trackedObjects.set(objectId, trackedObject);

    // Initialize Kalman filter for motion prediction
    if (this.config.enableMotionPrediction) {
      const kalman = new KalmanFilter();
      kalman.update({
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
      });
      this.kalmanFilters.set(objectId, kalman);
    }

    this.emit('tracker-initialized', trackedObject);

    return objectId;
  }

  /**
   * Track objects in new frame
   */
  async track(frame: FrameData, params: any = {}): Promise<FrameData> {
    // Update tracked objects
    for (const [id, obj] of this.trackedObjects) {
      await this.updateTracking(frame, obj);
    }

    // Remove lost objects
    this.cleanupLostObjects();

    // Detect new objects if detection is enabled
    if (params.detectNew) {
      await this.detectNewObjects(frame, params.objects || []);
    }

    // Add tracking visualization
    if (params.drawTracking) {
      return this.visualizeTracking(frame, params);
    }

    return {
      ...frame,
      metadata: {
        ...frame.metadata,
        trackedObjects: Array.from(this.trackedObjects.values())
      }
    };
  }

  /**
   * Update tracking for single object
   */
  private async updateTracking(frame: FrameData, obj: TrackedObject): Promise<void> {
    try {
      // Use selected algorithm
      let newBbox: BoundingBox | null = null;

      switch (this.config.algorithm) {
        case 'kcf':
          newBbox = await this.kcfTrack(frame, obj.bbox);
          break;
        case 'csrt':
          newBbox = await this.csrtTrack(frame, obj.bbox);
          break;
        case 'mosse':
          newBbox = await this.mosseTrack(frame, obj.bbox);
          break;
        case 'medianflow':
          newBbox = await this.medianFlowTrack(frame, obj.bbox);
          break;
      }

      if (newBbox) {
        // Calculate velocity
        const center = {
          x: newBbox.x + newBbox.width / 2,
          y: newBbox.y + newBbox.height / 2
        };

        const oldCenter = {
          x: obj.bbox.x + obj.bbox.width / 2,
          y: obj.bbox.y + obj.bbox.height / 2
        };

        obj.velocity = {
          x: center.x - oldCenter.x,
          y: center.y - oldCenter.y
        };

        // Update Kalman filter
        if (this.config.enableMotionPrediction) {
          const kalman = this.kalmanFilters.get(obj.id);
          if (kalman) {
            kalman.update(center);
          }
        }

        // Update trail
        if (this.config.maxTrailLength && this.config.maxTrailLength > 0) {
          if (!obj.trail) obj.trail = [];
          obj.trail.push(center);

          if (obj.trail.length > this.config.maxTrailLength) {
            obj.trail.shift();
          }
        }

        // Update object
        obj.bbox = newBbox;
        obj.age++;
        obj.state = 'active';

        this.emit('tracking-updated', obj);
      } else {
        // Tracking lost
        obj.state = 'lost';
        this.emit('tracking-lost', obj);
      }
    } catch (error) {
      console.error(`Tracking error for object ${obj.id}:`, error);
      obj.state = 'lost';
    }
  }

  /**
   * KCF (Kernelized Correlation Filters) tracking
   */
  private async kcfTrack(frame: FrameData, bbox: BoundingBox): Promise<BoundingBox | null> {
    // Simplified KCF implementation
    // In production, use OpenCV's KCF tracker

    const searchRadius = 20;
    const { x, y, width, height } = bbox;

    // Extract template from previous frame
    if (!this.previousFrame) {
      this.previousFrame = Buffer.from(frame.data);
      return bbox;
    }

    // Search for best match in current frame
    let bestMatch: BoundingBox | null = null;
    let bestScore = 0;

    for (let dy = -searchRadius; dy <= searchRadius; dy += 5) {
      for (let dx = -searchRadius; dx <= searchRadius; dx += 5) {
        const newBbox = {
          x: x + dx,
          y: y + dy,
          width,
          height
        };

        const score = this.computeSimilarity(
          this.previousFrame,
          frame.data,
          frame.width,
          frame.height,
          bbox,
          newBbox
        );

        if (score > bestScore) {
          bestScore = score;
          bestMatch = newBbox;
        }
      }
    }

    this.previousFrame = Buffer.from(frame.data);

    return bestScore > 0.5 ? bestMatch : null;
  }

  /**
   * CSRT (Discriminative Correlation Filter with Channel and Spatial Reliability) tracking
   */
  private async csrtTrack(frame: FrameData, bbox: BoundingBox): Promise<BoundingBox | null> {
    // Simplified CSRT - use KCF with slightly different parameters
    return this.kcfTrack(frame, bbox);
  }

  /**
   * MOSSE (Minimum Output Sum of Squared Error) tracking
   */
  private async mosseTrack(frame: FrameData, bbox: BoundingBox): Promise<BoundingBox | null> {
    // Simplified MOSSE
    return this.kcfTrack(frame, bbox);
  }

  /**
   * Median Flow tracking
   */
  private async medianFlowTrack(frame: FrameData, bbox: BoundingBox): Promise<BoundingBox | null> {
    if (!this.previousFrame) {
      this.previousFrame = Buffer.from(frame.data);
      return bbox;
    }

    // Track points using optical flow
    const points = this.generateGridPoints(bbox, 10);
    const trackedPoints = this.trackPoints(
      this.previousFrame,
      frame.data,
      frame.width,
      frame.height,
      points
    );

    if (trackedPoints.length < points.length / 2) {
      return null; // Lost tracking
    }

    // Calculate median displacement
    const displacements = trackedPoints.map((tp, i) => ({
      dx: tp.x - points[i].x,
      dy: tp.y - points[i].y
    }));

    displacements.sort((a, b) => a.dx - b.dx);
    const medianDx = displacements[Math.floor(displacements.length / 2)].dx;

    displacements.sort((a, b) => a.dy - b.dy);
    const medianDy = displacements[Math.floor(displacements.length / 2)].dy;

    this.previousFrame = Buffer.from(frame.data);

    return {
      x: bbox.x + medianDx,
      y: bbox.y + medianDy,
      width: bbox.width,
      height: bbox.height
    };
  }

  /**
   * Compute similarity between two regions
   */
  private computeSimilarity(
    img1: Buffer,
    img2: Buffer,
    width: number,
    height: number,
    bbox1: BoundingBox,
    bbox2: BoundingBox
  ): number {
    let sum = 0;
    let count = 0;

    for (let y = 0; y < bbox1.height; y++) {
      for (let x = 0; x < bbox1.width; x++) {
        const x1 = bbox1.x + x;
        const y1 = bbox1.y + y;
        const x2 = bbox2.x + x;
        const y2 = bbox2.y + y;

        if (
          x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
          x2 >= 0 && x2 < width && y2 >= 0 && y2 < height
        ) {
          const idx1 = (y1 * width + x1) * 4;
          const idx2 = (y2 * width + x2) * 4;

          // Compute normalized cross-correlation
          const diff = Math.abs(img1[idx1] - img2[idx2]) +
                       Math.abs(img1[idx1 + 1] - img2[idx2 + 1]) +
                       Math.abs(img1[idx1 + 2] - img2[idx2 + 2]);

          sum += 1 - diff / (3 * 255);
          count++;
        }
      }
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Generate grid of points in bounding box
   */
  private generateGridPoints(bbox: BoundingBox, gridSize: number): Point[] {
    const points: Point[] = [];
    const stepX = bbox.width / (gridSize + 1);
    const stepY = bbox.height / (gridSize + 1);

    for (let i = 1; i <= gridSize; i++) {
      for (let j = 1; j <= gridSize; j++) {
        points.push({
          x: bbox.x + stepX * i,
          y: bbox.y + stepY * j
        });
      }
    }

    return points;
  }

  /**
   * Track points using optical flow
   */
  private trackPoints(
    prevImg: Buffer,
    currImg: Buffer,
    width: number,
    height: number,
    points: Point[]
  ): Point[] {
    const trackedPoints: Point[] = [];
    const windowSize = 5;

    for (const point of points) {
      let bestMatch: Point | null = null;
      let bestScore = 0;

      // Search in small window around previous position
      for (let dy = -windowSize; dy <= windowSize; dy++) {
        for (let dx = -windowSize; dx <= windowSize; dx++) {
          const newPoint = {
            x: point.x + dx,
            y: point.y + dy
          };

          const score = this.computePointSimilarity(
            prevImg,
            currImg,
            width,
            height,
            point,
            newPoint,
            3
          );

          if (score > bestScore) {
            bestScore = score;
            bestMatch = newPoint;
          }
        }
      }

      if (bestMatch && bestScore > 0.7) {
        trackedPoints.push(bestMatch);
      }
    }

    return trackedPoints;
  }

  /**
   * Compute similarity between two points
   */
  private computePointSimilarity(
    img1: Buffer,
    img2: Buffer,
    width: number,
    height: number,
    p1: Point,
    p2: Point,
    windowSize: number
  ): number {
    let sum = 0;
    let count = 0;

    for (let dy = -windowSize; dy <= windowSize; dy++) {
      for (let dx = -windowSize; dx <= windowSize; dx++) {
        const x1 = Math.floor(p1.x + dx);
        const y1 = Math.floor(p1.y + dy);
        const x2 = Math.floor(p2.x + dx);
        const y2 = Math.floor(p2.y + dy);

        if (
          x1 >= 0 && x1 < width && y1 >= 0 && y1 < height &&
          x2 >= 0 && x2 < width && y2 >= 0 && y2 < height
        ) {
          const idx1 = (y1 * width + x1) * 4;
          const idx2 = (y2 * width + x2) * 4;

          const diff = Math.abs(img1[idx1] - img2[idx2]) +
                       Math.abs(img1[idx1 + 1] - img2[idx2 + 1]) +
                       Math.abs(img1[idx1 + 2] - img2[idx2 + 2]);

          sum += 1 - diff / (3 * 255);
          count++;
        }
      }
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Detect new objects
   */
  private async detectNewObjects(frame: FrameData, objectLabels: string[]): Promise<void> {
    // Placeholder for object detection
    // In production, use YOLO, SSD, or other detection models
    this.emit('detection-attempted', { labels: objectLabels });
  }

  /**
   * Clean up lost objects
   */
  private cleanupLostObjects(): void {
    const maxAge = 30; // Remove after 30 frames of being lost

    for (const [id, obj] of this.trackedObjects) {
      if (obj.state === 'lost' && obj.age > maxAge) {
        this.trackedObjects.delete(id);
        this.kalmanFilters.delete(id);
        this.emit('object-removed', id);
      }
    }
  }

  /**
   * Visualize tracking
   */
  private visualizeTracking(frame: FrameData, params: any): FrameData {
    const data = Buffer.from(frame.data);
    const { width, height } = frame;

    for (const obj of this.trackedObjects.values()) {
      // Draw bounding box
      const color = obj.state === 'active' ? [0, 255, 0] : [255, 0, 0];
      this.drawBoundingBox(data, width, height, obj.bbox, color);

      // Draw label
      this.drawLabel(data, width, height, obj.bbox, obj.label, color);

      // Draw trail
      if (params.showTrails && obj.trail && obj.trail.length > 1) {
        this.drawTrail(data, width, height, obj.trail, color);
      }

      // Draw velocity vector
      if (params.showVelocity && obj.velocity) {
        this.drawVelocityVector(data, width, height, obj.bbox, obj.velocity, color);
      }

      // Draw predicted position
      if (params.showPrediction && this.config.enableMotionPrediction) {
        const kalman = this.kalmanFilters.get(obj.id);
        if (kalman) {
          const predicted = kalman.predict();
          this.drawPrediction(data, width, height, predicted, [255, 255, 0]);
        }
      }
    }

    return { ...frame, data };
  }

  /**
   * Draw bounding box
   */
  private drawBoundingBox(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox,
    color: number[]
  ): void {
    const thickness = 2;

    for (let t = 0; t < thickness; t++) {
      // Top and bottom
      for (let x = bbox.x; x < bbox.x + bbox.width; x++) {
        this.setPixel(data, width, height, x, bbox.y + t, color);
        this.setPixel(data, width, height, x, bbox.y + bbox.height - t, color);
      }

      // Left and right
      for (let y = bbox.y; y < bbox.y + bbox.height; y++) {
        this.setPixel(data, width, height, bbox.x + t, y, color);
        this.setPixel(data, width, height, bbox.x + bbox.width - t, y, color);
      }
    }
  }

  /**
   * Draw label
   */
  private drawLabel(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox,
    label: string,
    color: number[]
  ): void {
    // Simple label background
    const labelHeight = 15;
    const labelWidth = label.length * 8;

    for (let y = 0; y < labelHeight; y++) {
      for (let x = 0; x < labelWidth; x++) {
        this.setPixel(data, width, height, bbox.x + x, bbox.y - labelHeight + y, [0, 0, 0]);
      }
    }
  }

  /**
   * Draw trail
   */
  private drawTrail(
    data: Buffer,
    width: number,
    height: number,
    trail: Point[],
    color: number[]
  ): void {
    for (let i = 1; i < trail.length; i++) {
      this.drawLine(
        data,
        width,
        height,
        Math.floor(trail[i - 1].x),
        Math.floor(trail[i - 1].y),
        Math.floor(trail[i].x),
        Math.floor(trail[i].y),
        color
      );
    }
  }

  /**
   * Draw velocity vector
   */
  private drawVelocityVector(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox,
    velocity: { x: number; y: number },
    color: number[]
  ): void {
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    const endX = centerX + velocity.x * 10;
    const endY = centerY + velocity.y * 10;

    this.drawLine(data, width, height, centerX, centerY, endX, endY, color);
  }

  /**
   * Draw prediction
   */
  private drawPrediction(
    data: Buffer,
    width: number,
    height: number,
    point: Point,
    color: number[]
  ): void {
    const radius = 5;

    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          this.setPixel(
            data,
            width,
            height,
            Math.floor(point.x + x),
            Math.floor(point.y + y),
            color
          );
        }
      }
    }
  }

  /**
   * Draw line
   */
  private drawLine(
    data: Buffer,
    width: number,
    height: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number[]
  ): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = Math.floor(x1);
    let y = Math.floor(y1);

    while (true) {
      this.setPixel(data, width, height, x, y, color);

      if (x === Math.floor(x2) && y === Math.floor(y2)) break;

      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }

      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Set pixel color
   */
  private setPixel(
    data: Buffer,
    width: number,
    height: number,
    x: number,
    y: number,
    color: number[]
  ): void {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = (y * width + x) * 4;
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
    }
  }

  /**
   * Get all tracked objects
   */
  getTrackedObjects(): TrackedObject[] {
    return Array.from(this.trackedObjects.values());
  }

  /**
   * Remove specific tracker
   */
  removeTracker(objectId: number): void {
    this.trackedObjects.delete(objectId);
    this.kalmanFilters.delete(objectId);
    this.emit('tracker-removed', objectId);
  }

  /**
   * Clear all trackers
   */
  clearTrackers(): void {
    this.trackedObjects.clear();
    this.kalmanFilters.clear();
    this.previousFrame = null;
    this.emit('trackers-cleared');
  }

  /**
   * Get object by ID
   */
  getObject(objectId: number): TrackedObject | undefined {
    return this.trackedObjects.get(objectId);
  }
}
