/**
 * Face Detection Module for Computer Vision Platform
 *
 * Demonstrates Elide's polyglot capabilities by seamlessly integrating
 * Python's dlib and face_recognition libraries within TypeScript.
 *
 * Features:
 * - Face detection using HOG and CNN models
 * - Facial landmark extraction (68-point model)
 * - Face encoding generation for recognition
 * - Batch processing capabilities
 * - GPU acceleration support
 */

// @ts-ignore - Elide polyglot import: dlib for face detection
import dlib from 'python:dlib';
// @ts-ignore - Elide polyglot import: face_recognition for encoding
import face_recognition from 'python:face_recognition';
// @ts-ignore - Elide polyglot import: cv2 for image processing
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import: numpy for array operations
import numpy from 'python:numpy';

/**
 * Face detection result containing bounding box and metadata
 */
export interface FaceDetectionResult {
  box: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  confidence: number;
  landmarks?: FacialLandmarks;
  encoding?: number[];
}

/**
 * Facial landmarks (68-point model)
 */
export interface FacialLandmarks {
  chin: Array<{ x: number; y: number }>;
  leftEyebrow: Array<{ x: number; y: number }>;
  rightEyebrow: Array<{ x: number; y: number }>;
  noseBridge: Array<{ x: number; y: number }>;
  noseTip: Array<{ x: number; y: number }>;
  leftEye: Array<{ x: number; y: number }>;
  rightEye: Array<{ x: number; y: number }>;
  topLip: Array<{ x: number; y: number }>;
  bottomLip: Array<{ x: number; y: number }>;
}

/**
 * Face detector configuration options
 */
export interface FaceDetectorConfig {
  model: 'hog' | 'cnn';
  upsampleTimes: number;
  jitterTimes: number;
  numThreads: number;
  minFaceSize: number;
  confidenceThreshold: number;
  enableLandmarks: boolean;
  enableEncoding: boolean;
  gpuAcceleration: boolean;
}

/**
 * Default configuration for face detector
 */
const DEFAULT_CONFIG: FaceDetectorConfig = {
  model: 'hog',
  upsampleTimes: 1,
  jitterTimes: 1,
  numThreads: 4,
  minFaceSize: 20,
  confidenceThreshold: 0.6,
  enableLandmarks: true,
  enableEncoding: true,
  gpuAcceleration: false,
};

/**
 * Face Detector class using dlib and face_recognition
 *
 * Showcases Elide's ability to use Python ML libraries directly in TypeScript
 */
export class FaceDetector {
  private config: FaceDetectorConfig;
  private hogDetector: any;
  private cnnDetector: any;
  private landmarkPredictor: any;
  private faceEncoder: any;
  private isInitialized: boolean = false;

  constructor(config?: Partial<FaceDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  /**
   * Initialize face detector models
   * Demonstrates Python library initialization through Elide
   */
  private initialize(): void {
    try {
      console.log('Initializing Face Detector with config:', this.config);

      // Initialize HOG face detector (Python dlib)
      if (this.config.model === 'hog') {
        this.hogDetector = dlib.get_frontal_face_detector();
        console.log('HOG face detector initialized');
      }

      // Initialize CNN face detector if specified
      if (this.config.model === 'cnn' || this.config.gpuAcceleration) {
        try {
          const modelPath = 'models/mmod_human_face_detector.dat';
          this.cnnDetector = dlib.cnn_face_detection_model_v1(modelPath);
          console.log('CNN face detector initialized');
        } catch (error) {
          console.warn('CNN model not found, falling back to HOG:', error);
          this.hogDetector = dlib.get_frontal_face_detector();
          this.config.model = 'hog';
        }
      }

      // Initialize facial landmark predictor
      if (this.config.enableLandmarks) {
        try {
          const landmarkPath = 'models/shape_predictor_68_face_landmarks.dat';
          this.landmarkPredictor = dlib.shape_predictor(landmarkPath);
          console.log('Facial landmark predictor initialized');
        } catch (error) {
          console.warn('Landmark model not found:', error);
          this.config.enableLandmarks = false;
        }
      }

      // Initialize face encoder
      if (this.config.enableEncoding) {
        // face_recognition library handles model loading internally
        this.faceEncoder = face_recognition;
        console.log('Face encoder initialized');
      }

      this.isInitialized = true;
      console.log('Face detector initialization complete');
    } catch (error) {
      console.error('Failed to initialize face detector:', error);
      throw new Error(`Face detector initialization failed: ${error}`);
    }
  }

  /**
   * Detect faces in an image
   *
   * @param image - Image as numpy array or file path
   * @param options - Detection options
   * @returns Array of detected faces
   */
  public detect(
    image: any,
    options?: {
      includeConfidence?: boolean;
      includeLandmarks?: boolean;
      includeEncoding?: boolean;
    }
  ): FaceDetectionResult[] {
    if (!this.isInitialized) {
      throw new Error('Face detector not initialized');
    }

    try {
      // Load image if path is provided
      const imgArray = typeof image === 'string'
        ? this.loadImage(image)
        : image;

      // Detect faces based on model type
      const detections = this.config.model === 'cnn'
        ? this.detectWithCNN(imgArray)
        : this.detectWithHOG(imgArray);

      // Process each detection
      const results: FaceDetectionResult[] = [];
      for (const detection of detections) {
        const result: FaceDetectionResult = {
          box: detection.box,
          confidence: detection.confidence,
        };

        // Extract landmarks if requested
        if (options?.includeLandmarks && this.config.enableLandmarks) {
          result.landmarks = this.extractLandmarks(imgArray, detection.box);
        }

        // Generate encoding if requested
        if (options?.includeEncoding && this.config.enableEncoding) {
          result.encoding = this.encode(imgArray, detection.box);
        }

        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Face detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect faces using HOG (Histogram of Oriented Gradients)
   * Fast CPU-based detection
   */
  private detectWithHOG(image: any): Array<{ box: any; confidence: number }> {
    const detections = [];

    // Detect faces using dlib HOG detector
    const faces = this.hogDetector(
      image,
      this.config.upsampleTimes
    );

    for (const face of faces) {
      // Extract bounding box coordinates
      const box = {
        top: face.top(),
        right: face.right(),
        bottom: face.bottom(),
        left: face.left(),
      };

      // Filter by minimum face size
      const width = box.right - box.left;
      const height = box.bottom - box.top;
      if (width < this.config.minFaceSize || height < this.config.minFaceSize) {
        continue;
      }

      detections.push({
        box,
        confidence: 1.0, // HOG doesn't provide confidence scores
      });
    }

    return detections;
  }

  /**
   * Detect faces using CNN (Convolutional Neural Network)
   * More accurate but slower, GPU-accelerated if available
   */
  private detectWithCNN(image: any): Array<{ box: any; confidence: number }> {
    const detections = [];

    // Detect faces using dlib CNN detector
    const faces = this.cnnDetector(
      image,
      this.config.upsampleTimes
    );

    for (const detection of faces) {
      const rect = detection.rect;
      const confidence = detection.confidence;

      // Filter by confidence threshold
      if (confidence < this.config.confidenceThreshold) {
        continue;
      }

      // Extract bounding box coordinates
      const box = {
        top: rect.top(),
        right: rect.right(),
        bottom: rect.bottom(),
        left: rect.left(),
      };

      // Filter by minimum face size
      const width = box.right - box.left;
      const height = box.bottom - box.top;
      if (width < this.config.minFaceSize || height < this.config.minFaceSize) {
        continue;
      }

      detections.push({ box, confidence });
    }

    return detections;
  }

  /**
   * Extract 68 facial landmarks
   *
   * @param image - Image as numpy array
   * @param box - Face bounding box
   * @returns Facial landmarks
   */
  public extractLandmarks(image: any, box: any): FacialLandmarks | undefined {
    if (!this.landmarkPredictor) {
      return undefined;
    }

    try {
      // Convert box to dlib rectangle
      const rect = dlib.rectangle(
        box.left,
        box.top,
        box.right,
        box.bottom
      );

      // Predict landmarks
      const shape = this.landmarkPredictor(image, rect);

      // Extract landmark points
      const landmarks: FacialLandmarks = {
        chin: [],
        leftEyebrow: [],
        rightEyebrow: [],
        noseBridge: [],
        noseTip: [],
        leftEye: [],
        rightEye: [],
        topLip: [],
        bottomLip: [],
      };

      // Map 68 landmark points to facial features
      // Points 0-16: Chin
      for (let i = 0; i < 17; i++) {
        const point = shape.part(i);
        landmarks.chin.push({ x: point.x, y: point.y });
      }

      // Points 17-21: Left eyebrow
      for (let i = 17; i < 22; i++) {
        const point = shape.part(i);
        landmarks.leftEyebrow.push({ x: point.x, y: point.y });
      }

      // Points 22-26: Right eyebrow
      for (let i = 22; i < 27; i++) {
        const point = shape.part(i);
        landmarks.rightEyebrow.push({ x: point.x, y: point.y });
      }

      // Points 27-30: Nose bridge
      for (let i = 27; i < 31; i++) {
        const point = shape.part(i);
        landmarks.noseBridge.push({ x: point.x, y: point.y });
      }

      // Points 31-35: Nose tip
      for (let i = 31; i < 36; i++) {
        const point = shape.part(i);
        landmarks.noseTip.push({ x: point.x, y: point.y });
      }

      // Points 36-41: Left eye
      for (let i = 36; i < 42; i++) {
        const point = shape.part(i);
        landmarks.leftEye.push({ x: point.x, y: point.y });
      }

      // Points 42-47: Right eye
      for (let i = 42; i < 48; i++) {
        const point = shape.part(i);
        landmarks.rightEye.push({ x: point.x, y: point.y });
      }

      // Points 48-59: Top lip
      for (let i = 48; i < 60; i++) {
        const point = shape.part(i);
        landmarks.topLip.push({ x: point.x, y: point.y });
      }

      // Points 60-67: Bottom lip
      for (let i = 60; i < 68; i++) {
        const point = shape.part(i);
        landmarks.bottomLip.push({ x: point.x, y: point.y });
      }

      return landmarks;
    } catch (error) {
      console.error('Landmark extraction failed:', error);
      return undefined;
    }
  }

  /**
   * Generate face encoding (128-dimensional vector)
   *
   * @param image - Image as numpy array
   * @param box - Face bounding box
   * @param jitter - Number of times to re-sample face for encoding
   * @returns Face encoding as array of numbers
   */
  public encode(image: any, box?: any, jitter?: number): number[] {
    if (!this.faceEncoder) {
      throw new Error('Face encoder not initialized');
    }

    try {
      const numJitters = jitter || this.config.jitterTimes;

      if (box) {
        // Encode specific face region
        const faceLocation = [box.top, box.right, box.bottom, box.left];
        const encodings = face_recognition.face_encodings(
          image,
          [faceLocation],
          numJitters
        );

        if (encodings.length === 0) {
          throw new Error('Failed to encode face');
        }

        // Convert numpy array to JavaScript array
        return Array.from(encodings[0]);
      } else {
        // Encode all faces in image
        const encodings = face_recognition.face_encodings(
          image,
          null,
          numJitters
        );

        if (encodings.length === 0) {
          throw new Error('No faces found in image');
        }

        // Return first face encoding
        return Array.from(encodings[0]);
      }
    } catch (error) {
      console.error('Face encoding failed:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple images
   *
   * @param images - Array of images or file paths
   * @param options - Detection options
   * @returns Array of detection results per image
   */
  public batchDetect(
    images: any[],
    options?: {
      includeConfidence?: boolean;
      includeLandmarks?: boolean;
      includeEncoding?: boolean;
    }
  ): FaceDetectionResult[][] {
    const results: FaceDetectionResult[][] = [];

    for (let i = 0; i < images.length; i++) {
      try {
        console.log(`Processing image ${i + 1}/${images.length}`);
        const detections = this.detect(images[i], options);
        results.push(detections);
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error);
        results.push([]);
      }
    }

    return results;
  }

  /**
   * Load image from file path
   *
   * @param path - Path to image file
   * @returns Image as numpy array (RGB format)
   */
  private loadImage(path: string): any {
    try {
      // Load image using cv2
      const img = cv2.imread(path);

      // Convert BGR to RGB (cv2 loads in BGR, face_recognition expects RGB)
      const rgbImg = cv2.cvtColor(img, cv2.COLOR_BGR2RGB);

      return rgbImg;
    } catch (error) {
      console.error(`Failed to load image from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Align face based on landmarks
   * Useful for improving recognition accuracy
   *
   * @param image - Image as numpy array
   * @param landmarks - Facial landmarks
   * @returns Aligned face image
   */
  public alignFace(image: any, landmarks: FacialLandmarks): any {
    try {
      // Calculate eye centers
      const leftEyeCenter = this.calculateCenter(landmarks.leftEye);
      const rightEyeCenter = this.calculateCenter(landmarks.rightEye);

      // Calculate angle between eyes
      const dx = rightEyeCenter.x - leftEyeCenter.x;
      const dy = rightEyeCenter.y - leftEyeCenter.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Calculate center point between eyes
      const eyesCenter = {
        x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
        y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
      };

      // Get rotation matrix
      const rotationMatrix = cv2.getRotationMatrix2D(
        [eyesCenter.x, eyesCenter.y],
        angle,
        1.0
      );

      // Apply affine transformation
      const height = image.shape[0];
      const width = image.shape[1];
      const alignedFace = cv2.warpAffine(
        image,
        rotationMatrix,
        [width, height],
        { flags: cv2.INTER_CUBIC }
      );

      return alignedFace;
    } catch (error) {
      console.error('Face alignment failed:', error);
      return image; // Return original image if alignment fails
    }
  }

  /**
   * Calculate center point of a set of points
   */
  private calculateCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    const sum = points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  /**
   * Crop face from image
   *
   * @param image - Image as numpy array
   * @param box - Face bounding box
   * @param padding - Padding around face (percentage)
   * @returns Cropped face image
   */
  public cropFace(image: any, box: any, padding: number = 0.2): any {
    try {
      const height = image.shape[0];
      const width = image.shape[1];

      // Calculate padding
      const faceWidth = box.right - box.left;
      const faceHeight = box.bottom - box.top;
      const padX = Math.floor(faceWidth * padding);
      const padY = Math.floor(faceHeight * padding);

      // Apply padding with bounds checking
      const top = Math.max(0, box.top - padY);
      const bottom = Math.min(height, box.bottom + padY);
      const left = Math.max(0, box.left - padX);
      const right = Math.min(width, box.right + padX);

      // Crop face region
      const croppedFace = image[
        numpy.s_[top:bottom, left:right]
      ];

      return croppedFace;
    } catch (error) {
      console.error('Face cropping failed:', error);
      throw error;
    }
  }

  /**
   * Resize image while maintaining aspect ratio
   *
   * @param image - Image as numpy array
   * @param maxSize - Maximum dimension (width or height)
   * @returns Resized image
   */
  public resizeImage(image: any, maxSize: number): any {
    try {
      const height = image.shape[0];
      const width = image.shape[1];

      if (height <= maxSize && width <= maxSize) {
        return image;
      }

      let newHeight: number;
      let newWidth: number;

      if (height > width) {
        newHeight = maxSize;
        newWidth = Math.floor((width * maxSize) / height);
      } else {
        newWidth = maxSize;
        newHeight = Math.floor((height * maxSize) / width);
      }

      const resized = cv2.resize(
        image,
        [newWidth, newHeight],
        { interpolation: cv2.INTER_AREA }
      );

      return resized;
    } catch (error) {
      console.error('Image resizing failed:', error);
      throw error;
    }
  }

  /**
   * Update detector configuration
   *
   * @param config - New configuration options
   */
  public updateConfig(config: Partial<FaceDetectorConfig>): void {
    const needsReinit =
      config.model !== undefined && config.model !== this.config.model ||
      config.enableLandmarks !== undefined && config.enableLandmarks !== this.config.enableLandmarks ||
      config.enableEncoding !== undefined && config.enableEncoding !== this.config.enableEncoding;

    this.config = { ...this.config, ...config };

    if (needsReinit) {
      this.initialize();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): FaceDetectorConfig {
    return { ...this.config };
  }

  /**
   * Check if detector is initialized and ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get detector statistics
   */
  public getStats(): {
    model: string;
    isInitialized: boolean;
    hasLandmarkPredictor: boolean;
    hasEncoder: boolean;
  } {
    return {
      model: this.config.model,
      isInitialized: this.isInitialized,
      hasLandmarkPredictor: this.landmarkPredictor !== null,
      hasEncoder: this.faceEncoder !== null,
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.hogDetector = null;
    this.cnnDetector = null;
    this.landmarkPredictor = null;
    this.faceEncoder = null;
    this.isInitialized = false;
    console.log('Face detector disposed');
  }
}

/**
 * Utility function to compare two face encodings
 *
 * @param encoding1 - First face encoding
 * @param encoding2 - Second face encoding
 * @param tolerance - Matching tolerance (lower is stricter)
 * @returns True if faces match
 */
export function compareFaces(
  encoding1: number[],
  encoding2: number[],
  tolerance: number = 0.6
): boolean {
  try {
    // Calculate Euclidean distance between encodings
    const distance = calculateDistance(encoding1, encoding2);
    return distance <= tolerance;
  } catch (error) {
    console.error('Face comparison failed:', error);
    return false;
  }
}

/**
 * Calculate Euclidean distance between two vectors
 */
function calculateDistance(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }

  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Calculate face distance (similarity metric)
 * Lower values indicate more similar faces
 *
 * @param knownEncodings - Array of known face encodings
 * @param faceEncoding - Face encoding to compare
 * @returns Array of distances
 */
export function faceDistance(
  knownEncodings: number[][],
  faceEncoding: number[]
): number[] {
  const distances: number[] = [];

  for (const knownEncoding of knownEncodings) {
    distances.push(calculateDistance(knownEncoding, faceEncoding));
  }

  return distances;
}

/**
 * Find best matching face from known encodings
 *
 * @param knownEncodings - Array of known face encodings
 * @param faceEncoding - Face encoding to match
 * @param tolerance - Matching tolerance
 * @returns Index of best match, or -1 if no match
 */
export function findBestMatch(
  knownEncodings: number[][],
  faceEncoding: number[],
  tolerance: number = 0.6
): { index: number; distance: number } {
  const distances = faceDistance(knownEncodings, faceEncoding);

  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < distances.length; i++) {
    if (distances[i] < bestDistance && distances[i] <= tolerance) {
      bestDistance = distances[i];
      bestIndex = i;
    }
  }

  return {
    index: bestIndex,
    distance: bestDistance,
  };
}
