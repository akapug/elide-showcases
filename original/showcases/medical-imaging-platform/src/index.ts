/**
 * Medical Imaging Platform - Main Entry Point
 *
 * Exports all modules for easy importing
 */

// DICOM Processing
export {
  DICOMProcessor,
  readDICOM,
  getPixelArray,
  dicomToPNG,
  type DICOMDataset,
  type DICOMMetadata,
  type PixelArrayInfo,
} from './dicom-processor';

// Image Analysis
export {
  ImageAnalyzer,
  loadImage,
  getStatistics,
  gaussianSmooth,
  type ImageStatistics,
  type FilterOptions,
  type RegistrationResult,
} from './image-analysis';

// Segmentation
export {
  MedicalSegmentation,
  segmentOrgan,
  detectTumors,
  type SegmentationMask,
  type OrganSegmentationResult,
  type Abnormality,
  type WatershedResult,
} from './segmentation';

// ML Diagnosis
export {
  DiagnosisAssistant,
  diagnoseImage,
  generateDiagnosticReport,
  type DiagnosisResult,
  type DetectionResult,
  type ModelMetrics,
  type PredictionExplanation,
} from './ml-diagnosis';

// Visualization
export {
  VolumeVisualizer,
  InteractiveViewer,
  extractSurface,
  getMultiplanarViews,
  type VolumeRenderOptions,
  type SliceView,
  type SurfaceMesh,
  type MeasurementResult,
} from './visualization';

// PACS Integration
export {
  PACSIntegration,
  DICOMStorageSCP,
  queryPACS,
  retrieveStudy,
  type PACSConfig,
  type StudyQuery,
  type StudyResult,
  type SeriesResult,
  type WorklistItem,
} from './pacs-integration';

// Version
export const VERSION = '1.0.0';

// Welcome message
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   Medical Imaging Platform v${VERSION}                          ║
║   Powered by Elide Polyglot Runtime                          ║
╚═══════════════════════════════════════════════════════════════╝

Python medical libraries in TypeScript:
  ✓ pydicom - DICOM file I/O
  ✓ SimpleITK - Image processing
  ✓ scikit-image - Segmentation
  ✓ TensorFlow - ML diagnosis
  ✓ NumPy/SciPy - Numerical computing

All in one process with zero serialization overhead!
`);
