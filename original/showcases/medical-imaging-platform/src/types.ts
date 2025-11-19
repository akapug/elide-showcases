/**
 * Type Definitions for Medical Imaging Platform
 *
 * Comprehensive TypeScript type definitions for all medical imaging operations
 */

// ============================================================================
// DICOM Types
// ============================================================================

export interface DICOMFileMetadata {
  // File information
  filepath: string;
  filesize: number;
  transferSyntax: string;
  mediaStorageSOPClassUID: string;
  mediaStorageSOPInstanceUID: string;

  // Patient demographics
  patientName?: string;
  patientID?: string;
  patientBirthDate?: string;
  patientSex?: 'M' | 'F' | 'O';
  patientAge?: string;
  patientWeight?: number;
  patientHeight?: number;

  // Study information
  studyInstanceUID: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  studyID?: string;
  accessionNumber?: string;
  referringPhysicianName?: string;

  // Series information
  seriesInstanceUID: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: ModalityType;
  bodyPartExamined?: string;
  patientPosition?: string;

  // Image information
  sopInstanceUID: string;
  sopClassUID: string;
  instanceNumber?: number;
  imageType?: string[];
  acquisitionDate?: string;
  acquisitionTime?: string;
  contentDate?: string;
  contentTime?: string;

  // Image dimensions
  rows: number;
  columns: number;
  numberOfFrames?: number;
  pixelSpacing?: [number, number];
  sliceThickness?: number;
  sliceLocation?: number;
  imagePositionPatient?: [number, number, number];
  imageOrientationPatient?: number[];

  // Image attributes
  samplesPerPixel: number;
  photometricInterpretation: string;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;

  // Acquisition parameters (modality-specific)
  kvp?: number;
  exposureTime?: number;
  xRayTubeCurrent?: number;
  exposure?: number;
  magneticFieldStrength?: number;
  scanningSequence?: string;
  sequenceVariant?: string;
  scanOptions?: string;
  mrAcquisitionType?: string;
  repetitionTime?: number;
  echoTime?: number;
  inversionTime?: number;
  flipAngle?: number;

  // Display parameters
  windowCenter?: number | number[];
  windowWidth?: number | number[];
  windowCenterWidthExplanation?: string[];

  // Equipment
  manufacturer?: string;
  manufacturerModelName?: string;
  deviceSerialNumber?: string;
  softwareVersions?: string[];
  institutionName?: string;
  stationName?: string;
}

export type ModalityType =
  | 'CT' // Computed Tomography
  | 'MR' // Magnetic Resonance
  | 'CR' // Computed Radiography
  | 'DX' // Digital Radiography
  | 'MG' // Mammography
  | 'US' // Ultrasound
  | 'NM' // Nuclear Medicine
  | 'PT' // Positron Emission Tomography
  | 'XA' // X-Ray Angiography
  | 'RF' // Radio Fluoroscopy
  | 'RTIMAGE' // Radiotherapy Image
  | 'RTDOSE' // Radiotherapy Dose
  | 'RTSTRUCT' // Radiotherapy Structure Set
  | 'RTPLAN' // Radiotherapy Plan
  | 'OT' // Other
  | string;

// ============================================================================
// Image Processing Types
// ============================================================================

export interface ImageArray {
  data: ArrayLike<number>;
  shape: number[];
  dtype: DTypeString;
  min: number;
  max: number;
  mean: number;
  std: number;
}

export type DTypeString =
  | 'int8'
  | 'uint8'
  | 'int16'
  | 'uint16'
  | 'int32'
  | 'uint32'
  | 'float32'
  | 'float64';

export interface VolumeData {
  data: any; // NumPy array
  dimensions: [number, number, number];
  spacing: [number, number, number];
  origin: [number, number, number];
  direction: number[];
  modality: ModalityType;
  numberOfSlices: number;
}

export interface ImageSlice {
  data: any; // NumPy array or SimpleITK image
  sliceNumber: number;
  location: number;
  thickness: number;
  orientation: 'axial' | 'sagittal' | 'coronal' | 'oblique';
}

export interface HounsfieldUnit {
  value: number;
  tissue: TissueType;
}

export type TissueType =
  | 'air'
  | 'lung'
  | 'fat'
  | 'water'
  | 'soft_tissue'
  | 'muscle'
  | 'blood'
  | 'bone'
  | 'metal';

export const HounsfieldRanges: Record<TissueType, [number, number]> = {
  air: [-1000, -950],
  lung: [-950, -500],
  fat: [-120, -90],
  water: [-10, 10],
  soft_tissue: [30, 70],
  muscle: [40, 60],
  blood: [30, 45],
  bone: [300, 3000],
  metal: [1000, 3000],
};

// ============================================================================
// Segmentation Types
// ============================================================================

export type OrganType =
  | 'brain'
  | 'heart'
  | 'lung_left'
  | 'lung_right'
  | 'liver'
  | 'spleen'
  | 'pancreas'
  | 'kidney_left'
  | 'kidney_right'
  | 'stomach'
  | 'bladder'
  | 'prostate'
  | 'uterus'
  | 'bone';

export interface OrganMask {
  organ: OrganType;
  mask: any; // Binary NumPy array
  confidence: number;
  method: SegmentationMethod;
  processingTime: number;
}

export type SegmentationMethod =
  | 'threshold'
  | 'region_growing'
  | 'watershed'
  | 'active_contour'
  | 'level_set'
  | 'ml_unet'
  | 'ml_segnet'
  | 'ml_deeplab'
  | 'hybrid';

export interface SegmentationQuality {
  diceScore?: number; // Dice similarity coefficient
  jaccardIndex?: number; // IoU
  hausdorffDistance?: number;
  volumeError?: number;
  surfaceDistance?: number;
}

export interface AbnormalityDetection {
  type: AbnormalityType;
  location: Point3D;
  boundingBox: BoundingBox3D;
  volume: number; // mm³
  maxDiameter: number; // mm
  shape: ShapeDescriptor;
  intensity: IntensityStats;
  confidence: number;
  malignancyScore?: number;
  recommendations: string[];
}

export type AbnormalityType =
  | 'nodule'
  | 'mass'
  | 'tumor'
  | 'lesion'
  | 'cyst'
  | 'calcification'
  | 'opacity'
  | 'consolidation'
  | 'effusion'
  | 'pneumothorax'
  | 'fracture'
  | 'hemorrhage';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
  width: number;
  height: number;
  depth: number;
}

export interface ShapeDescriptor {
  sphericity: number; // 0-1, 1 = perfect sphere
  compactness: number;
  elongation: number;
  irregularity: number;
}

export interface IntensityStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
}

// ============================================================================
// ML/AI Types
// ============================================================================

export type DiseaseCategory =
  | 'normal'
  | 'infectious'
  | 'neoplastic'
  | 'inflammatory'
  | 'degenerative'
  | 'traumatic'
  | 'vascular'
  | 'congenital'
  | 'metabolic';

export interface DiseaseClassification {
  disease: string;
  category: DiseaseCategory;
  probability: number;
  severity: DiseaseSeverity;
  acuity: 'acute' | 'chronic' | 'subacute';
  icd10Code?: string;
}

export type DiseaseSeverity = 'minimal' | 'mild' | 'moderate' | 'severe' | 'critical';

export interface ModelPrediction {
  modelName: string;
  modelVersion: string;
  timestamp: Date;
  inputShape: number[];
  predictions: DiseaseClassification[];
  topPrediction: DiseaseClassification;
  confidenceThreshold: number;
  processingTime: number;
}

export interface FeatureImportance {
  featureName: string;
  importance: number;
  visualizationData?: any;
}

export interface GradCAMResult {
  heatmap: any; // 2D NumPy array
  overlayImage: any;
  keyRegions: BoundingBox2D[];
}

export interface BoundingBox2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Visualization Types
// ============================================================================

export type ProjectionType = 'mip' | 'minip' | 'aip' | 'volume_render';

export type ViewOrientation = 'axial' | 'sagittal' | 'coronal' | 'oblique' | '3d';

export interface ViewportSettings {
  orientation: ViewOrientation;
  sliceIndex?: number;
  windowLevel: WindowLevel;
  zoom: number;
  pan: Point2D;
  rotation: number;
  flip: { horizontal: boolean; vertical: boolean };
}

export interface WindowLevel {
  center: number;
  width: number;
  preset?: WindowLevelPreset;
}

export type WindowLevelPreset =
  | 'lung'
  | 'mediastinum'
  | 'bone'
  | 'brain'
  | 'abdomen'
  | 'liver'
  | 'spine'
  | 'custom';

export const WindowLevelPresets: Record<WindowLevelPreset, WindowLevel> = {
  lung: { center: -600, width: 1500, preset: 'lung' },
  mediastinum: { center: 50, width: 350, preset: 'mediastinum' },
  bone: { center: 300, width: 1500, preset: 'bone' },
  brain: { center: 40, width: 80, preset: 'brain' },
  abdomen: { center: 50, width: 400, preset: 'abdomen' },
  liver: { center: 60, width: 150, preset: 'liver' },
  spine: { center: 50, width: 250, preset: 'spine' },
  custom: { center: 0, width: 400, preset: 'custom' },
};

export interface Point2D {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  points: Point3D[];
  text?: string;
  color: RGB;
  visible: boolean;
  locked: boolean;
  creator: string;
  timestamp: Date;
}

export type AnnotationType =
  | 'point'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'freehand'
  | 'text';

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a?: number; // 0-1
}

// ============================================================================
// Measurement Types
// ============================================================================

export interface Measurement {
  id: string;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  points: Point3D[];
  description?: string;
  timestamp: Date;
}

export type MeasurementType =
  | 'distance'
  | 'area'
  | 'volume'
  | 'angle'
  | 'density'
  | 'diameter'
  | 'circumference'
  | 'hounsfield';

export type MeasurementUnit =
  | 'mm'
  | 'cm'
  | 'mm2'
  | 'cm2'
  | 'mm3'
  | 'ml'
  | 'degrees'
  | 'HU'
  | 'pixels';

// ============================================================================
// PACS Types
// ============================================================================

export interface PACSStudy {
  studyInstanceUID: string;
  studyID: string;
  accessionNumber: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  patientName: string;
  patientID: string;
  patientBirthDate: string;
  patientSex: 'M' | 'F' | 'O';
  modalities: ModalityType[];
  numberOfSeries: number;
  numberOfInstances: number;
  institutionName?: string;
  referringPhysician?: string;
}

export interface PACSSeries {
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: ModalityType;
  bodyPartExamined?: string;
  numberOfInstances: number;
  seriesDate?: string;
  seriesTime?: string;
}

export interface PACSImage {
  sopInstanceUID: string;
  sopClassUID: string;
  instanceNumber: number;
  rows: number;
  columns: number;
  acquisitionDate?: string;
  acquisitionTime?: string;
}

export interface WorklistEntry {
  accessionNumber: string;
  scheduledProcedureStepID: string;
  scheduledStationAET: string;
  scheduledProcedureStepStartDate: string;
  scheduledProcedureStepStartTime: string;
  modality: ModalityType;
  scheduledPerformingPhysicianName?: string;
  scheduledProcedureStepDescription?: string;
  patientName: string;
  patientID: string;
  patientBirthDate?: string;
  patientSex?: 'M' | 'F' | 'O';
  patientWeight?: number;
  medicalAlerts?: string;
  contrastAllergies?: string;
  specialNeeds?: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface DiagnosticReport {
  reportID: string;
  studyInstanceUID: string;
  reportType: ReportType;
  status: ReportStatus;
  patientInfo: PatientInfo;
  studyInfo: StudyInfo;
  findings: Finding[];
  impressions: Impression[];
  recommendations: Recommendation[];
  measurements: Measurement[];
  comparisons?: Comparison[];
  radiologist: Radiologist;
  timestamp: Date;
  signedTimestamp?: Date;
}

export type ReportType = 'preliminary' | 'final' | 'addendum' | 'amended';

export type ReportStatus = 'draft' | 'pending' | 'signed' | 'verified' | 'amended';

export interface PatientInfo {
  name: string;
  id: string;
  birthDate: string;
  sex: 'M' | 'F' | 'O';
  age: string;
}

export interface StudyInfo {
  studyInstanceUID: string;
  accessionNumber: string;
  studyDate: string;
  studyDescription: string;
  modality: ModalityType;
  bodyPart: string;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  description: string;
  location: string;
  severity: DiseaseSeverity;
  measurements?: Measurement[];
  images?: string[]; // SOP Instance UIDs
}

export type FindingCategory =
  | 'normal'
  | 'abnormal'
  | 'incidental'
  | 'artifact'
  | 'limitation';

export interface Impression {
  text: string;
  priority: number;
  category: DiseaseCategory;
}

export interface Recommendation {
  text: string;
  urgency: 'routine' | 'urgent' | 'stat';
  type: 'followup' | 'treatment' | 'referral' | 'none';
}

export interface Comparison {
  priorStudyUID: string;
  priorStudyDate: string;
  comparisonText: string;
  change: 'improved' | 'stable' | 'worsened' | 'new' | 'resolved';
}

export interface Radiologist {
  name: string;
  credentials: string;
  licenseNumber: string;
  signature?: string;
}

// ============================================================================
// Performance Metrics Types
// ============================================================================

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsed?: number;
  cpuUsage?: number;
  success: boolean;
  error?: string;
}

export interface BenchmarkResults {
  testName: string;
  iterations: number;
  results: {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
  };
  throughput: number; // operations per second
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PlatformConfig {
  dicom: DICOMConfig;
  analysis: AnalysisConfig;
  ml: MLConfig;
  visualization: VisualizationConfig;
  pacs: PACSConnectionConfig;
}

export interface DICOMConfig {
  enableCache: boolean;
  cacheSize: number;
  validateOnRead: boolean;
  defaultTransferSyntax?: string;
}

export interface AnalysisConfig {
  defaultInterpolation: 'nearest' | 'linear' | 'cubic';
  defaultFilterSigma: number;
  parallelProcessing: boolean;
  maxThreads?: number;
}

export interface MLConfig {
  modelsPath: string;
  device: 'cpu' | 'cuda' | 'mps';
  batchSize: number;
  confidenceThreshold: number;
  enableExplanations: boolean;
}

export interface VisualizationConfig {
  defaultColormap: string;
  renderQuality: 'low' | 'medium' | 'high';
  enableHardwareAcceleration: boolean;
  maxTextureSize: number;
}

export interface PACSConnectionConfig {
  host: string;
  port: number;
  aet: string;
  callingAet: string;
  timeout: number;
  retries: number;
  enableCompression: boolean;
}
