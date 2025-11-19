/**
 * Computer Vision Platform - Type Definitions
 *
 * Comprehensive types for all CV operations
 */

// ============================================================================
// Image Types
// ============================================================================

export interface ImageData {
  data: any; // NumPy array (H, W, C)
  width: number;
  height: number;
  channels: number;
  dtype: string;
}

export interface GrayscaleImage {
  data: any; // NumPy array (H, W)
  width: number;
  height: number;
}

export interface RGBImage extends ImageData {
  channels: 3;
}

export interface RGBAImage extends ImageData {
  channels: 4;
}

// ============================================================================
// Detection Types
// ============================================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionResult {
  class: string;
  classId: number;
  confidence: number;
  bbox: BoundingBox;
  mask?: any; // Optional segmentation mask
}

export interface YOLOConfig {
  modelPath: string;
  configPath?: string;
  weightsPath?: string;
  confidenceThreshold?: number;
  nmsThreshold?: number;
  inputSize?: number;
}

export interface YOLODetection {
  detections: DetectionResult[];
  inferenceTime: number;
  preprocessTime: number;
  postprocessTime: number;
}

// ============================================================================
// Face Recognition Types
// ============================================================================

export interface FacialLandmarks {
  leftEye: Point[];
  rightEye: Point[];
  nose: Point[];
  mouth: Point[];
  jawline: Point[];
}

export interface Point {
  x: number;
  y: number;
}

export interface FaceDetection {
  bbox: BoundingBox;
  landmarks: FacialLandmarks;
  confidence: number;
}

export interface FaceEncoding {
  encoding: any; // NumPy array (128,)
  bbox: BoundingBox;
}

export interface FaceRecognitionResult {
  name: string;
  distance: number;
  confidence: number;
  bbox: BoundingBox;
}

export interface FaceDatabase {
  addFace(name: string, encoding: any): void;
  findMatch(encoding: any, threshold?: number): FaceRecognitionResult | null;
  getAllFaces(): Map<string, any[]>;
}

// ============================================================================
// Tracking Types
// ============================================================================

export interface TrackedObject {
  id: number;
  class: string;
  bbox: BoundingBox;
  confidence: number;
  age: number; // Frames since first detection
  hits: number; // Number of consecutive detections
  velocity?: { vx: number; vy: number };
}

export interface TrackingConfig {
  maxAge: number; // Max frames to keep track without detection
  minHits: number; // Min consecutive detections to confirm track
  iouThreshold: number; // IoU threshold for matching
}

// ============================================================================
// Segmentation Types
// ============================================================================

export interface SegmentationMask {
  mask: any; // NumPy array (H, W) with class IDs
  classes: string[];
  numClasses: number;
}

export interface InstanceSegmentation {
  masks: any[]; // List of binary masks
  classes: string[];
  scores: number[];
  bboxes: BoundingBox[];
}

export interface SemanticSegmentationResult {
  mask: SegmentationMask;
  colorMap: any; // NumPy array (H, W, 3) with colors
  inferenceTime: number;
}

// ============================================================================
// Video Processing Types
// ============================================================================

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  duration: number;
  codec: string;
}

export interface VideoFrame {
  frameNumber: number;
  timestamp: number;
  image: ImageData;
}

export interface VideoProcessingConfig {
  skipFrames?: number; // Process every Nth frame
  maxFrames?: number; // Max frames to process
  outputFps?: number; // Output video FPS
  resizeWidth?: number;
  resizeHeight?: number;
}

export interface VideoProcessingResult {
  framesProcessed: number;
  totalTime: number;
  avgFps: number;
  detections?: DetectionResult[][];
  tracks?: TrackedObject[][];
}

// ============================================================================
// Enhancement Types
// ============================================================================

export interface EnhancementConfig {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  sharpness?: number; // 0 to 2
  denoise?: boolean;
  denoiseStrength?: number;
}

export interface SuperResolutionConfig {
  scale: number; // 2x, 3x, 4x
  model?: 'espcn' | 'fsrcnn' | 'edsr';
}

export interface ImageEnhancementResult {
  enhanced: ImageData;
  processingTime: number;
  improvements: {
    brightness: number;
    contrast: number;
    sharpness: number;
  };
}

// ============================================================================
// Feature Extraction Types
// ============================================================================

export interface ImageFeatures {
  sift?: SIFTFeatures;
  orb?: ORBFeatures;
  harris?: HarrisCorners;
  hog?: HOGFeatures;
}

export interface SIFTFeatures {
  keypoints: any[]; // cv2.KeyPoint objects
  descriptors: any; // NumPy array
  numKeypoints: number;
}

export interface ORBFeatures {
  keypoints: any[];
  descriptors: any;
  numKeypoints: number;
}

export interface HarrisCorners {
  corners: Point[];
  numCorners: number;
}

export interface HOGFeatures {
  features: any; // NumPy array
  visualImage?: ImageData;
}

// ============================================================================
// Pose Estimation Types
// ============================================================================

export interface PoseKeypoint {
  name: string;
  position: Point;
  confidence: number;
}

export interface PoseEstimation {
  keypoints: PoseKeypoint[];
  skeleton: [number, number][]; // Pairs of keypoint indices
  confidence: number;
  bbox: BoundingBox;
}

export interface MultiPersonPose {
  poses: PoseEstimation[];
  inferenceTime: number;
}

// ============================================================================
// OCR Types
// ============================================================================

export interface TextDetection {
  text: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface OCRResult {
  detections: TextDetection[];
  fullText: string;
  processingTime: number;
}

// ============================================================================
// Model Types
// ============================================================================

export interface ModelConfig {
  modelPath: string;
  inputSize: [number, number];
  mean?: number[];
  std?: number[];
  device?: 'cpu' | 'cuda';
}

export interface InferenceResult {
  output: any; // Model output tensor
  inferenceTime: number;
  preprocessTime: number;
  postprocessTime: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface DrawingOptions {
  color?: Color;
  thickness?: number;
  lineType?: number;
  filled?: boolean;
}

export interface PerformanceMetrics {
  totalTime: number;
  fps: number;
  avgInferenceTime: number;
  maxInferenceTime: number;
  minInferenceTime: number;
  memoryUsed: number;
}
