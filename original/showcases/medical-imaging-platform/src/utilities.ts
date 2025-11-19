/**
 * Medical Imaging Utilities
 *
 * Helper functions for common medical imaging tasks
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sitk from 'python:SimpleITK';

import type {
  HounsfieldUnit,
  TissueType,
  WindowLevel,
  WindowLevelPreset,
  Point3D,
  Measurement,
} from './types';

import { HounsfieldRanges, WindowLevelPresets } from './types';

// ============================================================================
// Hounsfield Unit Utilities
// ============================================================================

/**
 * Identify tissue type from Hounsfield Unit value
 */
export function identifyTissue(hu: number): TissueType {
  for (const [tissue, [min, max]] of Object.entries(HounsfieldRanges)) {
    if (hu >= min && hu <= max) {
      return tissue as TissueType;
    }
  }
  return 'soft_tissue'; // Default
}

/**
 * Convert pixel value to Hounsfield Units
 */
export function pixelToHU(
  pixelValue: number,
  rescaleSlope: number = 1.0,
  rescaleIntercept: number = -1024
): number {
  return pixelValue * rescaleSlope + rescaleIntercept;
}

/**
 * Convert Hounsfield Units to pixel value
 */
export function huToPixel(
  hu: number,
  rescaleSlope: number = 1.0,
  rescaleIntercept: number = -1024
): number {
  return (hu - rescaleIntercept) / rescaleSlope;
}

/**
 * Apply HU window/level to image
 */
export function applyHUWindow(
  pixels: any,
  windowCenter: number,
  windowWidth: number,
  rescaleSlope: number = 1.0,
  rescaleIntercept: number = -1024
): any {
  // Convert to HU
  const hu = pixels * rescaleSlope + rescaleIntercept;

  // Apply window
  const lower = windowCenter - windowWidth / 2;
  const upper = windowCenter + windowWidth / 2;

  const windowed = numpy.clip(hu, lower, upper);

  // Normalize to 0-255
  const normalized = ((windowed - lower) / windowWidth) * 255;

  return numpy.uint8(normalized);
}

/**
 * Get window/level preset
 */
export function getWindowLevelPreset(preset: WindowLevelPreset): WindowLevel {
  return WindowLevelPresets[preset];
}

// ============================================================================
// Image Conversion Utilities
// ============================================================================

/**
 * Normalize image to [0, 1] range
 */
export function normalizeImage(image: any): any {
  const min = numpy.min(image);
  const max = numpy.max(image);

  if (max === min) {
    return numpy.zeros_like(image);
  }

  return (image - min) / (max - min);
}

/**
 * Normalize image to specific range
 */
export function normalizeToRange(image: any, minVal: number, maxVal: number): any {
  const normalized = normalizeImage(image);
  return normalized * (maxVal - minVal) + minVal;
}

/**
 * Convert image to uint8 (0-255)
 */
export function toUint8(image: any): any {
  const normalized = normalizeToRange(image, 0, 255);
  return numpy.uint8(normalized);
}

/**
 * Convert grayscale to RGB
 */
export function grayscaleToRGB(image: any): any {
  // Stack grayscale image 3 times to create RGB
  return numpy.stack([image, image, image], axis: -1);
}

/**
 * Apply colormap to grayscale image
 */
export function applyColormap(
  image: any,
  colormap: 'gray' | 'hot' | 'jet' | 'bone' | 'copper' = 'gray'
): any {
  // Normalize to 0-255
  const uint8Image = toUint8(image);

  // In production, would use matplotlib.cm or custom colormaps
  // For now, return grayscale RGB
  return grayscaleToRGB(uint8Image);
}

// ============================================================================
// Geometry Utilities
// ============================================================================

/**
 * Calculate Euclidean distance between two 3D points
 */
export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate centroid of points
 */
export function calculateCentroid(points: Point3D[]): Point3D {
  if (points.length === 0) {
    throw new Error('Cannot calculate centroid of empty point set');
  }

  const sum = points.reduce(
    (acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y,
      z: acc.z + p.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
    z: sum.z / points.length,
  };
}

/**
 * Calculate angle between three points (in degrees)
 */
export function calculateAngle(p1: Point3D, vertex: Point3D, p2: Point3D): number {
  const v1 = {
    x: p1.x - vertex.x,
    y: p1.y - vertex.y,
    z: p1.z - vertex.z,
  };

  const v2 = {
    x: p2.x - vertex.x,
    y: p2.y - vertex.y,
    z: p2.z - vertex.z,
  };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  const cosAngle = dotProduct / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

  return (angleRad * 180) / Math.PI;
}

/**
 * Transform point by spacing (voxel to physical coordinates)
 */
export function voxelToPhysical(
  voxel: Point3D,
  spacing: [number, number, number],
  origin: [number, number, number] = [0, 0, 0]
): Point3D {
  return {
    x: voxel.x * spacing[0] + origin[0],
    y: voxel.y * spacing[1] + origin[1],
    z: voxel.z * spacing[2] + origin[2],
  };
}

/**
 * Transform point from physical to voxel coordinates
 */
export function physicalToVoxel(
  physical: Point3D,
  spacing: [number, number, number],
  origin: [number, number, number] = [0, 0, 0]
): Point3D {
  return {
    x: (physical.x - origin[0]) / spacing[0],
    y: (physical.y - origin[1]) / spacing[1],
    z: (physical.z - origin[2]) / spacing[2],
  };
}

// ============================================================================
// Volume Utilities
// ============================================================================

/**
 * Calculate volume in mm³ from voxel count
 */
export function voxelsToVolume(
  numVoxels: number,
  spacing: [number, number, number]
): number {
  const voxelVolume = spacing[0] * spacing[1] * spacing[2];
  return numVoxels * voxelVolume;
}

/**
 * Calculate volume in ml from mm³
 */
export function mm3ToMl(volumeMm3: number): number {
  return volumeMm3 / 1000;
}

/**
 * Calculate surface area from voxels
 */
export function calculateSurfaceArea(
  surfaceVoxels: number,
  spacing: [number, number, number]
): number {
  // Approximate surface area as average face area * number of surface voxels
  const avgFaceArea =
    (2 * (spacing[0] * spacing[1] + spacing[1] * spacing[2] + spacing[0] * spacing[2])) / 3;

  return surfaceVoxels * avgFaceArea;
}

/**
 * Calculate sphericity (how sphere-like a shape is)
 */
export function calculateSphericity(volume: number, surfaceArea: number): number {
  // Sphericity = (π^(1/3) * (6V)^(2/3)) / A
  // Result is 1 for perfect sphere, < 1 for other shapes
  const numerator = Math.pow(Math.PI, 1 / 3) * Math.pow(6 * volume, 2 / 3);
  return numerator / surfaceArea;
}

// ============================================================================
// Image Quality Metrics
// ============================================================================

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 */
export function calculateSNR(signal: any, noise: any): number {
  const signalMean = numpy.mean(signal);
  const noiseStd = numpy.std(noise);

  if (noiseStd === 0) {
    return Infinity;
  }

  return signalMean / noiseStd;
}

/**
 * Calculate Contrast-to-Noise Ratio (CNR)
 */
export function calculateCNR(signal1: any, signal2: any, noise: any): number {
  const mean1 = numpy.mean(signal1);
  const mean2 = numpy.mean(signal2);
  const noiseStd = numpy.std(noise);

  if (noiseStd === 0) {
    return Infinity;
  }

  return Math.abs(mean1 - mean2) / noiseStd;
}

/**
 * Calculate image sharpness using gradient magnitude
 */
export function calculateSharpness(image: any): number {
  // Use Sobel operator to calculate gradients
  const array = sitk.GetArrayFromImage(image);

  // Simple gradient calculation (would use scipy.ndimage.sobel in production)
  const gradX = numpy.diff(array, axis: 1);
  const gradY = numpy.diff(array, axis: 0);

  // Gradient magnitude
  const magnitude = numpy.sqrt(gradX[:-1, :] ** 2 + gradY[:, :-1] ** 2);

  // Sharpness is mean gradient magnitude
  return Number(numpy.mean(magnitude));
}

// ============================================================================
// Statistical Utilities
// ============================================================================

/**
 * Calculate histogram with automatic binning
 */
export function calculateHistogram(
  data: any,
  bins: number | 'auto' = 'auto'
): { bins: number[]; counts: number[] } {
  let numBins = bins;

  if (bins === 'auto') {
    // Sturges' rule
    const n = data.size;
    numBins = Math.ceil(Math.log2(n) + 1);
  }

  const [counts, binEdges] = numpy.histogram(data, bins: numBins);

  return {
    bins: Array.from(binEdges),
    counts: Array.from(counts),
  };
}

/**
 * Calculate percentiles
 */
export function calculatePercentiles(
  data: any,
  percentiles: number[] = [25, 50, 75, 95, 99]
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const p of percentiles) {
    result[`p${p}`] = Number(numpy.percentile(data, p));
  }

  return result;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data: any, factor: number = 1.5): any {
  const q1 = numpy.percentile(data, 25);
  const q3 = numpy.percentile(data, 75);
  const iqr = q3 - q1;

  const lowerBound = q1 - factor * iqr;
  const upperBound = q3 + factor * iqr;

  return numpy.logical_or(data < lowerBound, data > upperBound);
}

// ============================================================================
// Coordinate System Utilities
// ============================================================================

/**
 * Parse DICOM Image Orientation Patient
 */
export function parseImageOrientation(
  orientation: number[]
): { rowDirection: Point3D; columnDirection: Point3D } {
  if (orientation.length !== 6) {
    throw new Error('Image Orientation Patient must have 6 values');
  }

  return {
    rowDirection: {
      x: orientation[0],
      y: orientation[1],
      z: orientation[2],
    },
    columnDirection: {
      x: orientation[3],
      y: orientation[4],
      z: orientation[5],
    },
  };
}

/**
 * Calculate slice normal vector from orientation
 */
export function calculateSliceNormal(orientation: number[]): Point3D {
  const { rowDirection, columnDirection } = parseImageOrientation(orientation);

  // Cross product to get normal
  const normal = {
    x: rowDirection.y * columnDirection.z - rowDirection.z * columnDirection.y,
    y: rowDirection.z * columnDirection.x - rowDirection.x * columnDirection.z,
    z: rowDirection.x * columnDirection.y - rowDirection.y * columnDirection.x,
  };

  // Normalize
  const magnitude = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);

  return {
    x: normal.x / magnitude,
    y: normal.y / magnitude,
    z: normal.z / magnitude,
  };
}

/**
 * Determine scan orientation from normal vector
 */
export function determineOrientation(normal: Point3D): 'axial' | 'sagittal' | 'coronal' | 'oblique' {
  const absX = Math.abs(normal.x);
  const absY = Math.abs(normal.y);
  const absZ = Math.abs(normal.z);

  const threshold = 0.8;

  if (absZ > threshold) {
    return 'axial';
  } else if (absX > threshold) {
    return 'sagittal';
  } else if (absY > threshold) {
    return 'coronal';
  } else {
    return 'oblique';
  }
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Parse DICOM date (YYYYMMDD) to Date object
 */
export function parseDICOMDate(dicomDate: string): Date | null {
  if (!dicomDate || dicomDate.length !== 8) {
    return null;
  }

  const year = parseInt(dicomDate.substring(0, 4));
  const month = parseInt(dicomDate.substring(4, 6)) - 1; // 0-indexed
  const day = parseInt(dicomDate.substring(6, 8));

  return new Date(year, month, day);
}

/**
 * Parse DICOM time (HHMMSS.FFFFFF) to time components
 */
export function parseDICOMTime(
  dicomTime: string
): { hours: number; minutes: number; seconds: number } | null {
  if (!dicomTime || dicomTime.length < 6) {
    return null;
  }

  const hours = parseInt(dicomTime.substring(0, 2));
  const minutes = parseInt(dicomTime.substring(2, 4));
  const seconds = parseInt(dicomTime.substring(4, 6));

  return { hours, minutes, seconds };
}

/**
 * Format DICOM date for display
 */
export function formatDICOMDate(dicomDate: string): string {
  const date = parseDICOMDate(dicomDate);
  if (!date) {
    return dicomDate;
  }

  return date.toLocaleDateString();
}

/**
 * Calculate patient age from birth date and study date
 */
export function calculatePatientAge(birthDate: string, studyDate: string): number {
  const birth = parseDICOMDate(birthDate);
  const study = parseDICOMDate(studyDate);

  if (!birth || !study) {
    return 0;
  }

  const diffMs = study.getTime() - birth.getTime();
  const ageDate = new Date(diffMs);

  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// ============================================================================
// Anonymization Utilities
// ============================================================================

/**
 * Generate anonymous patient ID
 */
export function generateAnonymousID(prefix: string = 'ANON'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);

  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Hash patient ID for anonymization (deterministic)
 */
export function hashPatientID(patientID: string, salt: string = ''): string {
  // Simple hash for demo (use crypto.createHash in production)
  let hash = 0;
  const str = patientID + salt;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `HASH-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate DICOM UID format
 */
export function isValidDICOMUID(uid: string): boolean {
  // DICOM UID: 0-9 and . characters, max 64 chars
  const regex = /^[0-9.]{1,64}$/;
  return regex.test(uid);
}

/**
 * Validate patient ID format
 */
export function isValidPatientID(patientID: string): boolean {
  // Allow alphanumeric and common separators
  const regex = /^[A-Za-z0-9\-_]{1,64}$/;
  return regex.test(patientID);
}

/**
 * Validate image dimensions
 */
export function areValidDimensions(rows: number, columns: number): boolean {
  return rows > 0 && rows <= 65536 && columns > 0 && columns <= 65536;
}

// ============================================================================
// Export All
// ============================================================================

export const MedicalImagingUtils = {
  // Hounsfield
  identifyTissue,
  pixelToHU,
  huToPixel,
  applyHUWindow,
  getWindowLevelPreset,

  // Image conversion
  normalizeImage,
  normalizeToRange,
  toUint8,
  grayscaleToRGB,
  applyColormap,

  // Geometry
  distance3D,
  calculateCentroid,
  calculateAngle,
  voxelToPhysical,
  physicalToVoxel,

  // Volume
  voxelsToVolume,
  mm3ToMl,
  calculateSurfaceArea,
  calculateSphericity,

  // Image quality
  calculateSNR,
  calculateCNR,
  calculateSharpness,

  // Statistics
  calculateHistogram,
  calculatePercentiles,
  detectOutliers,

  // Coordinates
  parseImageOrientation,
  calculateSliceNormal,
  determineOrientation,

  // Date/Time
  parseDICOMDate,
  parseDICOMTime,
  formatDICOMDate,
  calculatePatientAge,

  // Anonymization
  generateAnonymousID,
  hashPatientID,

  // Validation
  isValidDICOMUID,
  isValidPatientID,
  areValidDimensions,
};

export default MedicalImagingUtils;
