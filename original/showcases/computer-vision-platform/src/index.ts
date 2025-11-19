/**
 * Computer Vision Platform - Main Entry Point
 *
 * A comprehensive computer vision platform demonstrating Elide's polyglot
 * capabilities by seamlessly integrating Python CV libraries (OpenCV, MediaPipe,
 * Tesseract) with TypeScript.
 *
 * @module @elide/computer-vision-platform
 */

// ============================================================================
// Type Definitions
// ============================================================================

export * from './types.js';

// ============================================================================
// Object Detection
// ============================================================================

export { YOLODetector } from './detection/yolo.js';

// ============================================================================
// Face Recognition
// ============================================================================

export { FaceDetector } from './recognition/face-detector.js';
export { FaceDatabase } from './recognition/face-database.js';
export { FaceTracker } from './recognition/face-tracker.js';

// ============================================================================
// Segmentation
// ============================================================================

export { SemanticSegmentor } from './segmentation/semantic-segmentation.js';
export { InstanceSegmentor } from './segmentation/instance-segmentation.js';

// ============================================================================
// Object Tracking
// ============================================================================

export { ObjectTracker } from './tracking/object-tracker.js';
export { MultiObjectTracker } from './tracking/multi-object-tracker.js';

// ============================================================================
// Video Processing
// ============================================================================

export { VideoProcessor } from './video/video-processor.js';

// ============================================================================
// Pose Estimation (NEW)
// ============================================================================

export {
  PoseEstimator,
  type BodyPoseLandmarks,
  type HandLandmarks,
  type FaceMeshLandmarks,
  type FullBodyPose,
  type PoseEstimatorConfig,
  type HandDetectorConfig,
  type FaceMeshConfig,
  type GestureRecognitionResult,
  type ActivityRecognitionResult,
} from './pose/pose-estimator.js';

// ============================================================================
// OCR Text Recognition (NEW)
// ============================================================================

export {
  TextRecognizer,
  createTextRecognizer,
  PageSegmentationMode,
  OCREngineMode,
  PreprocessingStep,
  type TextRecognizerConfig,
  type TextLine,
  type TextWord,
  type TextBlock,
  type DocumentStructure,
  type LayoutAnalysis,
  type TableCell,
  type TableDetection,
  type LanguageDetectionResult,
  type TextEnhancementResult,
} from './ocr/text-recognizer.js';

// ============================================================================
// Image Enhancement (NEW)
// ============================================================================

export {
  ImageEnhancer,
  createImageEnhancer,
  SuperResolutionModel,
  type ImageEnhancerConfig,
  type DenoiseConfig,
  type SharpenConfig,
  type HDRConfig,
  type ToneMappingConfig,
  type LowLightConfig,
  type ColorGradingConfig,
  type NoiseReductionResult,
  type DetailEnhancementResult,
  type DynamicRangeResult,
} from './enhancement/image-enhancer.js';

// ============================================================================
// Version and Metadata
// ============================================================================

export const VERSION = '1.0.0';
export const DESCRIPTION = 'Computer Vision Platform - Powered by Elide Polyglot';

/**
 * Platform capabilities
 */
export const CAPABILITIES = {
  detection: {
    objectDetection: true,
    faceDetection: true,
    textDetection: true,
    poseDetection: true,
  },
  recognition: {
    faceRecognition: true,
    textRecognition: true,
    activityRecognition: true,
    gestureRecognition: true,
  },
  segmentation: {
    semantic: true,
    instance: true,
  },
  tracking: {
    singleObject: true,
    multiObject: true,
    faceTracking: true,
    poseTracking: true,
  },
  enhancement: {
    superResolution: true,
    denoising: true,
    sharpening: true,
    hdr: true,
    toneMapping: true,
    lowLight: true,
    colorGrading: true,
  },
  processing: {
    video: true,
    realtime: true,
    batch: true,
  },
};

/**
 * Supported models and frameworks
 */
export const SUPPORTED_FRAMEWORKS = {
  opencv: '4.8.0+',
  mediapipe: '0.10.0+',
  tesseract: '4.0.0+',
  yolo: 'v3, v4, v5, v8',
  dlib: '19.24.0+',
};

/**
 * Get platform information
 */
export function getPlatformInfo() {
  return {
    name: 'Elide Computer Vision Platform',
    version: VERSION,
    description: DESCRIPTION,
    capabilities: CAPABILITIES,
    frameworks: SUPPORTED_FRAMEWORKS,
  };
}

/**
 * Print platform information
 */
export function printPlatformInfo() {
  const info = getPlatformInfo();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         ELIDE COMPUTER VISION PLATFORM                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`Version: ${info.version}`);
  console.log(`Description: ${info.description}\n`);

  console.log('Capabilities:');
  console.log('─'.repeat(65));

  console.log('\n  Detection:');
  for (const [key, value] of Object.entries(info.capabilities.detection)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n  Recognition:');
  for (const [key, value] of Object.entries(info.capabilities.recognition)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n  Segmentation:');
  for (const [key, value] of Object.entries(info.capabilities.segmentation)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n  Tracking:');
  for (const [key, value] of Object.entries(info.capabilities.tracking)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n  Enhancement:');
  for (const [key, value] of Object.entries(info.capabilities.enhancement)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n  Processing:');
  for (const [key, value] of Object.entries(info.capabilities.processing)) {
    console.log(`    ${key}: ${value ? '✓' : '✗'}`);
  }

  console.log('\n' + '─'.repeat(65));
  console.log('\nSupported Frameworks:');
  for (const [key, value] of Object.entries(info.frameworks)) {
    console.log(`  ${key}: ${value}`);
  }

  console.log('\n' + '═'.repeat(65) + '\n');
}
