/**
 * Face Detection Module
 *
 * Advanced face detection and recognition with landmark detection,
 * face tracking, and beauty filters.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';

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
 * Face detection result
 */
interface Face {
  id: number;
  bbox: BoundingBox;
  landmarks?: FaceLandmarks;
  confidence: number;
  age?: number;
  gender?: 'male' | 'female';
  emotion?: Emotion;
  features?: FaceFeatures;
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
 * Face landmarks (68 points)
 */
interface FaceLandmarks {
  jawline: Point[];
  leftEyebrow: Point[];
  rightEyebrow: Point[];
  noseBridge: Point[];
  noseTip: Point[];
  leftEye: Point[];
  rightEye: Point[];
  outerLips: Point[];
  innerLips: Point[];
}

/**
 * 2D point
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Emotion detection
 */
interface Emotion {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  sad: number;
  surprise: number;
  neutral: number;
  dominant: string;
}

/**
 * Face features
 */
interface FaceFeatures {
  eyeDistance: number;
  noseLength: number;
  mouthWidth: number;
  faceWidth: number;
  faceHeight: number;
}

/**
 * Face detector configuration
 */
interface FaceDetectorConfig {
  minConfidence?: number;
  maxFaces?: number;
  modelPath?: string;
  detectLandmarks?: boolean;
  detectAge?: boolean;
  detectGender?: boolean;
  detectEmotion?: boolean;
  trackFaces?: boolean;
}

/**
 * Face filter configuration
 */
interface FaceFilterConfig {
  smoothing?: number;
  sharpen?: number;
  brightness?: number;
  eyeEnhancement?: number;
  lipEnhancement?: number;
}

/**
 * Face detector class
 */
export class FaceDetector extends EventEmitter {
  private config: FaceDetectorConfig;
  private pythonProcess: ChildProcess | null = null;
  private detectedFaces: Map<number, Face> = new Map();
  private faceIdCounter: number = 0;
  private isInitialized: boolean = false;
  private processingQueue: Array<{
    frame: FrameData;
    resolve: (faces: Face[]) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: FaceDetectorConfig = {}) {
    super();

    this.config = {
      minConfidence: 0.7,
      maxFaces: 10,
      modelPath: './models/face_detection',
      detectLandmarks: true,
      detectAge: false,
      detectGender: false,
      detectEmotion: true,
      trackFaces: true,
      ...config
    };
  }

  /**
   * Initialize face detector
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing face detector...');

    try {
      await this.initializePythonBackend();
      this.isInitialized = true;
      console.log('Face detector initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize face detector:', error);
      throw error;
    }
  }

  /**
   * Initialize Python backend for ML models
   */
  private async initializePythonBackend(): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, '../../python/face_detector.py');

      this.pythonProcess = spawn('python3', [
        pythonScript,
        '--model-path', this.config.modelPath || './models/face_detection',
        '--min-confidence', String(this.config.minConfidence)
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
          reject(new Error('Face detector initialization timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Handle messages from Python backend
   */
  private handlePythonMessage(message: string): void {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'faces-detected':
          this.handleFacesDetected(data.faces);
          break;
        case 'error':
          console.error('Python error:', data.message);
          break;
        default:
          console.log('Python:', message);
      }
    } catch (error) {
      // Not JSON, treat as log
      console.log('Python:', message);
    }
  }

  /**
   * Handle detected faces
   */
  private handleFacesDetected(faces: Face[]): void {
    if (this.config.trackFaces) {
      this.updateFaceTracking(faces);
    }

    this.emit('faces-detected', faces);

    // Resolve pending detection requests
    if (this.processingQueue.length > 0) {
      const request = this.processingQueue.shift()!;
      request.resolve(faces);
    }
  }

  /**
   * Update face tracking
   */
  private updateFaceTracking(newFaces: Face[]): void {
    const currentFaces = new Map(this.detectedFaces);

    // Match new faces with tracked faces
    for (const newFace of newFaces) {
      let matched = false;

      for (const [id, trackedFace] of currentFaces) {
        if (this.facesMatch(newFace, trackedFace)) {
          newFace.id = id;
          this.detectedFaces.set(id, newFace);
          currentFaces.delete(id);
          matched = true;
          break;
        }
      }

      if (!matched) {
        newFace.id = this.faceIdCounter++;
        this.detectedFaces.set(newFace.id, newFace);
      }
    }

    // Remove faces that are no longer detected
    for (const [id] of currentFaces) {
      this.detectedFaces.delete(id);
      this.emit('face-lost', id);
    }
  }

  /**
   * Check if two faces match (for tracking)
   */
  private facesMatch(face1: Face, face2: Face): boolean {
    const threshold = 0.3;

    const center1 = {
      x: face1.bbox.x + face1.bbox.width / 2,
      y: face1.bbox.y + face1.bbox.height / 2
    };

    const center2 = {
      x: face2.bbox.x + face2.bbox.width / 2,
      y: face2.bbox.y + face2.bbox.height / 2
    };

    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) +
      Math.pow(center1.y - center2.y, 2)
    );

    const maxDimension = Math.max(face1.bbox.width, face1.bbox.height);

    return distance < maxDimension * threshold;
  }

  /**
   * Detect faces in frame
   */
  async detect(frame: FrameData, params: any = {}): Promise<FrameData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const faces = await this.detectFaces(frame);

    // Draw faces on frame if requested
    if (params.drawBoundingBox || params.drawLandmarks) {
      const annotated = await this.annotateFaces(frame, faces, params);
      return annotated;
    }

    // Store faces in metadata
    return {
      ...frame,
      metadata: {
        ...frame.metadata,
        faces
      }
    };
  }

  /**
   * Detect faces using ML model
   */
  private async detectFaces(frame: FrameData): Promise<Face[]> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Face detector not initialized'));
        return;
      }

      this.processingQueue.push({ frame, resolve, reject });

      const request = {
        type: 'detect-faces',
        frame: {
          data: frame.data.toString('base64'),
          width: frame.width,
          height: frame.height
        },
        config: this.config
      };

      this.pythonProcess.stdin?.write(JSON.stringify(request) + '\n');

      // Timeout
      setTimeout(() => {
        const index = this.processingQueue.findIndex(
          req => req.frame === frame
        );

        if (index >= 0) {
          this.processingQueue.splice(index, 1);
          reject(new Error('Face detection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Annotate frame with detected faces
   */
  private async annotateFaces(
    frame: FrameData,
    faces: Face[],
    params: any
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { width, height } = frame;

    for (const face of faces) {
      if (params.drawBoundingBox) {
        this.drawBoundingBox(data, width, height, face.bbox, {
          color: [0, 255, 0],
          thickness: 2
        });

        // Draw confidence label
        this.drawText(data, width, height, {
          text: `${(face.confidence * 100).toFixed(0)}%`,
          x: face.bbox.x,
          y: face.bbox.y - 5,
          color: [0, 255, 0]
        });
      }

      if (params.drawLandmarks && face.landmarks) {
        this.drawLandmarks(data, width, height, face.landmarks);
      }

      if (params.showEmotion && face.emotion) {
        this.drawEmotion(data, width, height, face.bbox, face.emotion);
      }

      if (params.showAge && face.age !== undefined) {
        this.drawText(data, width, height, {
          text: `Age: ${face.age}`,
          x: face.bbox.x,
          y: face.bbox.y + face.bbox.height + 15,
          color: [255, 255, 0]
        });
      }

      if (params.showGender && face.gender) {
        this.drawText(data, width, height, {
          text: `Gender: ${face.gender}`,
          x: face.bbox.x,
          y: face.bbox.y + face.bbox.height + 30,
          color: [255, 255, 0]
        });
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
    style: { color: number[]; thickness: number }
  ): void {
    const { x, y, width: w, height: h } = bbox;
    const { color, thickness } = style;

    // Draw rectangle
    for (let t = 0; t < thickness; t++) {
      // Top line
      this.drawLine(data, width, height, x, y + t, x + w, y + t, color);

      // Bottom line
      this.drawLine(data, width, height, x, y + h - t, x + w, y + h - t, color);

      // Left line
      this.drawLine(data, width, height, x + t, y, x + t, y + h, color);

      // Right line
      this.drawLine(data, width, height, x + w - t, y, x + w - t, y + h, color);
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

    let x = x1;
    let y = y1;

    while (true) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        data[idx] = color[0];
        data[idx + 1] = color[1];
        data[idx + 2] = color[2];
      }

      if (x === x2 && y === y2) break;

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
   * Draw landmarks
   */
  private drawLandmarks(
    data: Buffer,
    width: number,
    height: number,
    landmarks: FaceLandmarks
  ): void {
    const drawPoints = (points: Point[], color: number[]) => {
      for (const point of points) {
        this.drawCircle(data, width, height, point.x, point.y, 2, color);
      }
    };

    drawPoints(landmarks.jawline, [255, 0, 0]);
    drawPoints(landmarks.leftEyebrow, [0, 255, 0]);
    drawPoints(landmarks.rightEyebrow, [0, 255, 0]);
    drawPoints(landmarks.noseBridge, [0, 0, 255]);
    drawPoints(landmarks.noseTip, [0, 0, 255]);
    drawPoints(landmarks.leftEye, [255, 255, 0]);
    drawPoints(landmarks.rightEye, [255, 255, 0]);
    drawPoints(landmarks.outerLips, [255, 0, 255]);
    drawPoints(landmarks.innerLips, [255, 0, 255]);
  }

  /**
   * Draw circle
   */
  private drawCircle(
    data: Buffer,
    width: number,
    height: number,
    cx: number,
    cy: number,
    radius: number,
    color: number[]
  ): void {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          const px = Math.floor(cx + x);
          const py = Math.floor(cy + y);

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            data[idx] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
          }
        }
      }
    }
  }

  /**
   * Draw text (simple implementation)
   */
  private drawText(
    data: Buffer,
    width: number,
    height: number,
    params: { text: string; x: number; y: number; color: number[] }
  ): void {
    // Simplified text rendering - in production, use canvas or image library
    const { x, y, color } = params;

    // Draw background rectangle
    const textWidth = params.text.length * 8;
    for (let dy = 0; dy < 12; dy++) {
      for (let dx = 0; dx < textWidth; dx++) {
        const px = x + dx;
        const py = y + dy;

        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        }
      }
    }
  }

  /**
   * Draw emotion
   */
  private drawEmotion(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox,
    emotion: Emotion
  ): void {
    const barWidth = bbox.width;
    const barHeight = 10;
    const x = bbox.x;
    let y = bbox.y - 30;

    // Draw emotion bars
    const emotions = [
      { name: 'happy', value: emotion.happy, color: [255, 255, 0] },
      { name: 'sad', value: emotion.sad, color: [0, 0, 255] },
      { name: 'angry', value: emotion.angry, color: [255, 0, 0] },
      { name: 'surprise', value: emotion.surprise, color: [255, 128, 0] }
    ];

    for (const emo of emotions) {
      if (emo.value > 0.1) {
        const fillWidth = barWidth * emo.value;

        for (let dy = 0; dy < barHeight; dy++) {
          for (let dx = 0; dx < fillWidth; dx++) {
            const px = x + dx;
            const py = y + dy;

            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              data[idx] = emo.color[0];
              data[idx + 1] = emo.color[1];
              data[idx + 2] = emo.color[2];
            }
          }
        }

        y -= barHeight + 2;
      }
    }
  }

  /**
   * Apply face filter (beauty filter)
   */
  async applyFilter(filterName: string, config: FaceFilterConfig = {}): Promise<void> {
    const filters = {
      beautify: this.beautifyFilter.bind(this),
      smooth: this.smoothFilter.bind(this),
      sharpen: this.sharpenFilter.bind(this),
      eyeEnhance: this.eyeEnhanceFilter.bind(this),
      lipEnhance: this.lipEnhanceFilter.bind(this)
    };

    if (!filters[filterName as keyof typeof filters]) {
      throw new Error(`Unknown face filter: ${filterName}`);
    }

    // Store filter configuration for processing
    this.emit('filter-configured', { filterName, config });
  }

  /**
   * Beautify filter
   */
  private async beautifyFilter(
    frame: FrameData,
    faces: Face[],
    config: FaceFilterConfig
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { smoothing = 0.7, sharpen = 0.3, brightness = 5 } = config;

    for (const face of faces) {
      // Apply smoothing to face region
      const faceRegion = this.extractFaceRegion(data, frame.width, frame.height, face.bbox);
      const smoothed = this.applySkinSmoothing(faceRegion, smoothing);

      // Apply sharpening to eyes and lips
      if (face.landmarks) {
        this.sharpenFeatures(smoothed, face.landmarks, sharpen);
      }

      // Brighten face
      this.adjustBrightness(smoothed, brightness);

      // Paste back to frame
      this.pasteFaceRegion(data, frame.width, frame.height, face.bbox, smoothed);
    }

    return { ...frame, data };
  }

  /**
   * Smooth filter
   */
  private async smoothFilter(
    frame: FrameData,
    faces: Face[],
    config: FaceFilterConfig
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { smoothing = 0.5 } = config;

    for (const face of faces) {
      const faceRegion = this.extractFaceRegion(data, frame.width, frame.height, face.bbox);
      const smoothed = this.applySkinSmoothing(faceRegion, smoothing);
      this.pasteFaceRegion(data, frame.width, frame.height, face.bbox, smoothed);
    }

    return { ...frame, data };
  }

  /**
   * Sharpen filter
   */
  private async sharpenFilter(
    frame: FrameData,
    faces: Face[],
    config: FaceFilterConfig
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { sharpen = 0.5 } = config;

    for (const face of faces) {
      if (face.landmarks) {
        const faceRegion = this.extractFaceRegion(data, frame.width, frame.height, face.bbox);
        this.sharpenFeatures(faceRegion, face.landmarks, sharpen);
        this.pasteFaceRegion(data, frame.width, frame.height, face.bbox, faceRegion);
      }
    }

    return { ...frame, data };
  }

  /**
   * Eye enhancement filter
   */
  private async eyeEnhanceFilter(
    frame: FrameData,
    faces: Face[],
    config: FaceFilterConfig
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { eyeEnhancement = 0.7 } = config;

    for (const face of faces) {
      if (face.landmarks) {
        this.enhanceEyes(data, frame.width, frame.height, face.landmarks, eyeEnhancement);
      }
    }

    return { ...frame, data };
  }

  /**
   * Lip enhancement filter
   */
  private async lipEnhanceFilter(
    frame: FrameData,
    faces: Face[],
    config: FaceFilterConfig
  ): Promise<FrameData> {
    const data = Buffer.from(frame.data);
    const { lipEnhancement = 0.7 } = config;

    for (const face of faces) {
      if (face.landmarks) {
        this.enhanceLips(data, frame.width, frame.height, face.landmarks, lipEnhancement);
      }
    }

    return { ...frame, data };
  }

  /**
   * Extract face region
   */
  private extractFaceRegion(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox
  ): Buffer {
    const regionData = Buffer.alloc(bbox.width * bbox.height * 4);
    let idx = 0;

    for (let y = bbox.y; y < bbox.y + bbox.height; y++) {
      for (let x = bbox.x; x < bbox.x + bbox.width; x++) {
        const srcIdx = (y * width + x) * 4;

        regionData[idx++] = data[srcIdx];
        regionData[idx++] = data[srcIdx + 1];
        regionData[idx++] = data[srcIdx + 2];
        regionData[idx++] = data[srcIdx + 3];
      }
    }

    return regionData;
  }

  /**
   * Paste face region back
   */
  private pasteFaceRegion(
    data: Buffer,
    width: number,
    height: number,
    bbox: BoundingBox,
    regionData: Buffer
  ): void {
    let idx = 0;

    for (let y = bbox.y; y < bbox.y + bbox.height; y++) {
      for (let x = bbox.x; x < bbox.x + bbox.width; x++) {
        const dstIdx = (y * width + x) * 4;

        data[dstIdx] = regionData[idx++];
        data[dstIdx + 1] = regionData[idx++];
        data[dstIdx + 2] = regionData[idx++];
        data[dstIdx + 3] = regionData[idx++];
      }
    }
  }

  /**
   * Apply skin smoothing
   */
  private applySkinSmoothing(data: Buffer, amount: number): Buffer {
    // Simplified bilateral filter for skin smoothing
    const result = Buffer.from(data);

    // In production, use proper bilateral filter
    // This is a simplified version
    for (let i = 0; i < result.length; i += 4) {
      const blend = amount;

      result[i] = result[i] * (1 - blend) + 220 * blend * 0.1;
      result[i + 1] = result[i + 1] * (1 - blend) + 200 * blend * 0.1;
      result[i + 2] = result[i + 2] * (1 - blend) + 180 * blend * 0.1;
    }

    return result;
  }

  /**
   * Sharpen features
   */
  private sharpenFeatures(data: Buffer, landmarks: FaceLandmarks, amount: number): void {
    // Apply sharpening to eye and lip regions
    // Simplified implementation
  }

  /**
   * Adjust brightness
   */
  private adjustBrightness(data: Buffer, amount: number): void {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + amount);
      data[i + 1] = Math.min(255, data[i + 1] + amount);
      data[i + 2] = Math.min(255, data[i + 2] + amount);
    }
  }

  /**
   * Enhance eyes
   */
  private enhanceEyes(
    data: Buffer,
    width: number,
    height: number,
    landmarks: FaceLandmarks,
    amount: number
  ): void {
    // Brighten and sharpen eye regions
    const enhanceRegion = (points: Point[]) => {
      for (const point of points) {
        const radius = 5;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const x = Math.floor(point.x + dx);
              const y = Math.floor(point.y + dy);

              if (x >= 0 && x < width && y >= 0 && y < height) {
                const idx = (y * width + x) * 4;

                data[idx] = Math.min(255, data[idx] + amount * 20);
                data[idx + 1] = Math.min(255, data[idx + 1] + amount * 20);
                data[idx + 2] = Math.min(255, data[idx + 2] + amount * 20);
              }
            }
          }
        }
      }
    };

    enhanceRegion(landmarks.leftEye);
    enhanceRegion(landmarks.rightEye);
  }

  /**
   * Enhance lips
   */
  private enhanceLips(
    data: Buffer,
    width: number,
    height: number,
    landmarks: FaceLandmarks,
    amount: number
  ): void {
    // Add color to lip region
    for (const point of landmarks.outerLips) {
      const radius = 3;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const x = Math.floor(point.x + dx);
            const y = Math.floor(point.y + dy);

            if (x >= 0 && x < width && y >= 0 && y < height) {
              const idx = (y * width + x) * 4;

              // Add red tint
              data[idx] = Math.min(255, data[idx] + amount * 30);
              data[idx + 1] = Math.max(0, data[idx + 1] - amount * 10);
              data[idx + 2] = Math.max(0, data[idx + 2] - amount * 10);
            }
          }
        }
      }
    }
  }

  /**
   * Get landmarks for frame
   */
  async getLandmarks(frame: FrameData): Promise<FaceLandmarks[]> {
    const faces = await this.detectFaces(frame);
    return faces.filter(f => f.landmarks).map(f => f.landmarks!);
  }

  /**
   * Get current tracked faces
   */
  getTrackedFaces(): Face[] {
    return Array.from(this.detectedFaces.values());
  }

  /**
   * Clear face tracking
   */
  clearTracking(): void {
    this.detectedFaces.clear();
    this.faceIdCounter = 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }

    this.detectedFaces.clear();
    this.processingQueue = [];
    this.isInitialized = false;
  }
}
