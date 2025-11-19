/**
 * DICOM Processor - Process DICOM files with Python's pydicom in TypeScript
 *
 * This demonstrates Elide's unique capability to use Python medical imaging
 * libraries directly in TypeScript with zero serialization overhead.
 */

// @ts-ignore - Python medical imaging library
import pydicom from 'python:pydicom';
// @ts-ignore - Python numerical computing
import numpy from 'python:numpy';

// ============================================================================
// Types
// ============================================================================

export interface DICOMDataset {
  // Patient Information
  PatientName?: string;
  PatientID?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
  PatientAge?: string;

  // Study Information
  StudyInstanceUID?: string;
  StudyDate?: string;
  StudyTime?: string;
  StudyDescription?: string;
  AccessionNumber?: string;

  // Series Information
  SeriesInstanceUID?: string;
  SeriesNumber?: number;
  SeriesDescription?: string;
  Modality?: string;

  // Image Information
  SOPInstanceUID?: string;
  InstanceNumber?: number;
  Rows?: number;
  Columns?: number;
  SliceThickness?: number;
  PixelSpacing?: [number, number];
  ImagePositionPatient?: [number, number, number];
  ImageOrientationPatient?: number[];

  // Acquisition Parameters
  KVP?: number;
  ExposureTime?: number;
  XRayTubeCurrent?: number;
  SliceLocation?: number;

  // Window/Level
  WindowCenter?: number;
  WindowWidth?: number;

  // Raw dataset for advanced access
  _raw?: any;
}

export interface DICOMMetadata {
  file: string;
  size: number;
  modality: string;
  dimensions: [number, number];
  pixelSpacing?: [number, number];
  sliceThickness?: number;
  numberOfFrames: number;
  transferSyntax: string;
  timestamp: number;
}

export interface PixelArrayInfo {
  shape: number[];
  dtype: string;
  min: number;
  max: number;
  mean: number;
  std: number;
}

// ============================================================================
// DICOM Processor Class
// ============================================================================

export class DICOMProcessor {
  private cache: Map<string, any> = new Map();
  private cacheEnabled: boolean;

  constructor(options?: { enableCache?: boolean }) {
    this.cacheEnabled = options?.enableCache ?? true;
  }

  /**
   * Read DICOM file using Python's pydicom
   *
   * This is uniquely enabled by Elide - we call Python's pydicom.dcmread()
   * directly from TypeScript with zero overhead!
   */
  readDICOM(filepath: string, options?: {
    stopBeforePixels?: boolean;
    force?: boolean;
  }): DICOMDataset {
    // Check cache
    if (this.cacheEnabled && this.cache.has(filepath)) {
      console.log(`[DICOM] Cache hit: ${filepath}`);
      return this.cache.get(filepath);
    }

    console.log(`[DICOM] Reading file: ${filepath}`);

    try {
      // Call Python's pydicom.dcmread() directly!
      const ds = pydicom.dcmread(
        filepath,
        stop_before_pixels: options?.stopBeforePixels ?? false,
        force: options?.force ?? false
      );

      // Extract metadata into TypeScript-friendly format
      const dataset: DICOMDataset = {
        // Patient info
        PatientName: this.safeGetTag(ds, 'PatientName'),
        PatientID: this.safeGetTag(ds, 'PatientID'),
        PatientBirthDate: this.safeGetTag(ds, 'PatientBirthDate'),
        PatientSex: this.safeGetTag(ds, 'PatientSex'),
        PatientAge: this.safeGetTag(ds, 'PatientAge'),

        // Study info
        StudyInstanceUID: this.safeGetTag(ds, 'StudyInstanceUID'),
        StudyDate: this.safeGetTag(ds, 'StudyDate'),
        StudyTime: this.safeGetTag(ds, 'StudyTime'),
        StudyDescription: this.safeGetTag(ds, 'StudyDescription'),
        AccessionNumber: this.safeGetTag(ds, 'AccessionNumber'),

        // Series info
        SeriesInstanceUID: this.safeGetTag(ds, 'SeriesInstanceUID'),
        SeriesNumber: this.safeGetTag(ds, 'SeriesNumber'),
        SeriesDescription: this.safeGetTag(ds, 'SeriesDescription'),
        Modality: this.safeGetTag(ds, 'Modality'),

        // Image info
        SOPInstanceUID: this.safeGetTag(ds, 'SOPInstanceUID'),
        InstanceNumber: this.safeGetTag(ds, 'InstanceNumber'),
        Rows: this.safeGetTag(ds, 'Rows'),
        Columns: this.safeGetTag(ds, 'Columns'),
        SliceThickness: this.safeGetTag(ds, 'SliceThickness'),
        PixelSpacing: this.safeGetTag(ds, 'PixelSpacing'),
        ImagePositionPatient: this.safeGetTag(ds, 'ImagePositionPatient'),
        ImageOrientationPatient: this.safeGetTag(ds, 'ImageOrientationPatient'),

        // Acquisition
        KVP: this.safeGetTag(ds, 'KVP'),
        ExposureTime: this.safeGetTag(ds, 'ExposureTime'),
        XRayTubeCurrent: this.safeGetTag(ds, 'XRayTubeCurrent'),
        SliceLocation: this.safeGetTag(ds, 'SliceLocation'),

        // Display
        WindowCenter: this.safeGetTag(ds, 'WindowCenter'),
        WindowWidth: this.safeGetTag(ds, 'WindowWidth'),

        // Keep raw Python object for advanced operations
        _raw: ds,
      };

      // Cache if enabled
      if (this.cacheEnabled) {
        this.cache.set(filepath, dataset);
      }

      return dataset;
    } catch (error) {
      console.error(`[DICOM] Error reading ${filepath}:`, error);
      throw new Error(`Failed to read DICOM file: ${error}`);
    }
  }

  /**
   * Get pixel array from DICOM dataset
   *
   * Returns a NumPy array directly - zero-copy memory sharing with Python!
   */
  getPixelArray(dataset: DICOMDataset): any {
    if (!dataset._raw) {
      throw new Error('Dataset does not have raw pydicom object');
    }

    try {
      // Access pixel_array attribute from Python pydicom Dataset
      // This is a NumPy array shared between Python and TypeScript!
      const pixelArray = dataset._raw.pixel_array;

      console.log(`[DICOM] Pixel array shape: ${pixelArray.shape}`);
      console.log(`[DICOM] Pixel array dtype: ${pixelArray.dtype}`);

      return pixelArray;
    } catch (error) {
      console.error('[DICOM] Error getting pixel array:', error);
      throw new Error(`Failed to get pixel array: ${error}`);
    }
  }

  /**
   * Get pixel array statistics using NumPy
   */
  getPixelArrayInfo(dataset: DICOMDataset): PixelArrayInfo {
    const pixels = this.getPixelArray(dataset);

    // Use NumPy functions directly in TypeScript!
    return {
      shape: Array.from(pixels.shape),
      dtype: String(pixels.dtype),
      min: Number(numpy.min(pixels)),
      max: Number(numpy.max(pixels)),
      mean: Number(numpy.mean(pixels)),
      std: Number(numpy.std(pixels)),
    };
  }

  /**
   * Extract metadata without loading pixel data
   */
  getMetadata(filepath: string): DICOMMetadata {
    const dataset = this.readDICOM(filepath, { stopBeforePixels: true });

    return {
      file: filepath,
      size: 0, // Would use fs.statSync in production
      modality: dataset.Modality || 'UNKNOWN',
      dimensions: [dataset.Rows || 0, dataset.Columns || 0],
      pixelSpacing: dataset.PixelSpacing,
      sliceThickness: dataset.SliceThickness,
      numberOfFrames: this.safeGetTag(dataset._raw, 'NumberOfFrames') || 1,
      transferSyntax: String(dataset._raw?.file_meta?.TransferSyntaxUID || ''),
      timestamp: Date.now(),
    };
  }

  /**
   * Apply window/level to pixel array
   *
   * Uses NumPy array operations directly in TypeScript!
   */
  applyWindowLevel(
    pixels: any,
    windowCenter: number,
    windowWidth: number
  ): any {
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;

    // Use NumPy clip function directly!
    const windowed = numpy.clip(pixels, lower, upper);

    // Normalize to 0-255 range
    const normalized = ((windowed - lower) / windowWidth) * 255;

    return numpy.uint8(normalized);
  }

  /**
   * Convert DICOM to PNG using Python PIL
   */
  async convertToPNG(
    dataset: DICOMDataset,
    outputPath: string,
    options?: {
      windowCenter?: number;
      windowWidth?: number;
      invert?: boolean;
    }
  ): Promise<void> {
    // @ts-ignore
    const PIL = await import('python:PIL');
    const Image = PIL.Image;

    const pixels = this.getPixelArray(dataset);

    // Apply window/level if specified
    let processedPixels = pixels;
    if (options?.windowCenter && options?.windowWidth) {
      processedPixels = this.applyWindowLevel(
        pixels,
        options.windowCenter,
        options.windowWidth
      );
    } else {
      // Auto-normalize to 0-255
      const min = numpy.min(pixels);
      const max = numpy.max(pixels);
      processedPixels = ((pixels - min) / (max - min)) * 255;
      processedPixels = numpy.uint8(processedPixels);
    }

    // Invert if needed (common for X-rays)
    if (options?.invert) {
      processedPixels = 255 - processedPixels;
    }

    // Create PIL Image from NumPy array and save
    const image = Image.fromarray(processedPixels);
    image.save(outputPath);

    console.log(`[DICOM] Saved PNG: ${outputPath}`);
  }

  /**
   * Anonymize DICOM file
   */
  anonymizeDICOM(
    inputPath: string,
    outputPath: string,
    options?: {
      patientName?: string;
      patientID?: string;
      keepStudyDate?: boolean;
    }
  ): void {
    const dataset = this.readDICOM(inputPath);

    if (!dataset._raw) {
      throw new Error('Cannot anonymize without raw dataset');
    }

    const ds = dataset._raw;

    // Remove patient identifying information
    ds.PatientName = options?.patientName || 'ANONYMOUS';
    ds.PatientID = options?.patientID || 'ANON-' + Date.now();

    // Remove other PHI
    if (ds.PatientBirthDate) ds.PatientBirthDate = '';
    if (ds.PatientSex) ds.PatientSex = '';
    if (ds.PatientAge) ds.PatientAge = '';

    if (!options?.keepStudyDate) {
      if (ds.StudyDate) ds.StudyDate = '';
      if (ds.StudyTime) ds.StudyTime = '';
    }

    // Save anonymized DICOM
    pydicom.dcmwrite(outputPath, ds);

    console.log(`[DICOM] Anonymized file saved: ${outputPath}`);
  }

  /**
   * Extract all DICOM tags
   */
  getAllTags(dataset: DICOMDataset): Record<string, any> {
    if (!dataset._raw) {
      throw new Error('Cannot get tags without raw dataset');
    }

    const tags: Record<string, any> = {};
    const ds = dataset._raw;

    // Iterate over all DICOM tags
    for (const elem of ds) {
      try {
        const tagName = elem.name;
        const value = elem.value;
        tags[tagName] = value;
      } catch (e) {
        // Skip tags that can't be read
      }
    }

    return tags;
  }

  /**
   * Read DICOM series (multiple files in a directory)
   */
  readSeries(directory: string): DICOMDataset[] {
    // In production, would scan directory for DICOM files
    // For now, placeholder
    console.log(`[DICOM] Reading series from: ${directory}`);
    return [];
  }

  /**
   * Sort series by instance number
   */
  sortSeriesByInstanceNumber(datasets: DICOMDataset[]): DICOMDataset[] {
    return datasets.sort((a, b) => {
      const aNum = a.InstanceNumber || 0;
      const bNum = b.InstanceNumber || 0;
      return aNum - bNum;
    });
  }

  /**
   * Build 3D volume from series
   */
  build3DVolume(datasets: DICOMDataset[]): any {
    if (datasets.length === 0) {
      throw new Error('Cannot build volume from empty series');
    }

    // Sort by instance number
    const sorted = this.sortSeriesByInstanceNumber(datasets);

    // Get pixel arrays
    const slices = sorted.map(ds => this.getPixelArray(ds));

    // Stack into 3D volume using NumPy
    const volume = numpy.stack(slices);

    console.log(`[DICOM] Built 3D volume with shape: ${volume.shape}`);

    return volume;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[DICOM] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; files: string[] } {
    return {
      size: this.cache.size,
      files: Array.from(this.cache.keys()),
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private safeGetTag(obj: any, tagName: string): any {
    try {
      const value = obj[tagName];
      // Convert Python types to JavaScript
      if (value === null || value === undefined) {
        return undefined;
      }
      // Handle MultiValue (array-like) from pydicom
      if (value && typeof value === 'object' && 'valueOf' in value) {
        return value.valueOf();
      }
      return value;
    } catch {
      return undefined;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick read DICOM file
 */
export function readDICOM(filepath: string): DICOMDataset {
  const processor = new DICOMProcessor();
  return processor.readDICOM(filepath);
}

/**
 * Quick get pixel array
 */
export function getPixelArray(filepath: string): any {
  const processor = new DICOMProcessor();
  const dataset = processor.readDICOM(filepath);
  return processor.getPixelArray(dataset);
}

/**
 * Quick convert DICOM to PNG
 */
export async function dicomToPNG(
  inputPath: string,
  outputPath: string,
  options?: {
    windowCenter?: number;
    windowWidth?: number;
    invert?: boolean;
  }
): Promise<void> {
  const processor = new DICOMProcessor();
  const dataset = processor.readDICOM(inputPath);
  await processor.convertToPNG(dataset, outputPath, options);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🏥 DICOM Processor Demo\n');

  // Demo with synthetic data (in production would use real DICOM files)
  console.log('Creating synthetic DICOM file with pydicom...\n');

  // Create a simple DICOM file using Python's pydicom
  const ds = new pydicom.Dataset();
  ds.PatientName = 'Test^Patient';
  ds.PatientID = 'TEST001';
  ds.Modality = 'CT';
  ds.StudyDescription = 'Test CT Scan';
  ds.SeriesDescription = 'Chest CT';
  ds.Rows = 512;
  ds.Columns = 512;

  // Create synthetic pixel data
  const syntheticPixels = numpy.random.randint(0, 4096, [512, 512], dtype: 'uint16');
  ds.PixelData = syntheticPixels.tobytes();

  // Set required DICOM tags for pixel data
  ds.SamplesPerPixel = 1;
  ds.PhotometricInterpretation = 'MONOCHROME2';
  ds.BitsAllocated = 16;
  ds.BitsStored = 16;
  ds.HighBit = 15;
  ds.PixelRepresentation = 0;

  // Save to file
  const testFile = '/tmp/test-ct.dcm';
  pydicom.dcmwrite(testFile, ds);

  console.log(`✅ Created synthetic DICOM: ${testFile}\n`);

  // Now test our processor
  const processor = new DICOMProcessor();

  // Read DICOM
  console.log('1. Reading DICOM file...');
  const dataset = processor.readDICOM(testFile);
  console.log(`   Patient: ${dataset.PatientName}`);
  console.log(`   Modality: ${dataset.Modality}`);
  console.log(`   Image size: ${dataset.Rows}x${dataset.Columns}\n`);

  // Get pixel array info
  console.log('2. Analyzing pixel data...');
  const info = processor.getPixelArrayInfo(dataset);
  console.log(`   Shape: ${info.shape.join('x')}`);
  console.log(`   Data type: ${info.dtype}`);
  console.log(`   Range: ${info.min} - ${info.max}`);
  console.log(`   Mean: ${info.mean.toFixed(2)}`);
  console.log(`   Std Dev: ${info.std.toFixed(2)}\n`);

  // Convert to PNG
  console.log('3. Converting to PNG...');
  await processor.convertToPNG(dataset, '/tmp/test-ct.png', {
    invert: false,
  });
  console.log('   ✅ PNG saved: /tmp/test-ct.png\n');

  // Anonymize
  console.log('4. Anonymizing DICOM...');
  processor.anonymizeDICOM(testFile, '/tmp/test-ct-anon.dcm', {
    patientName: 'ANONYMOUS',
    keepStudyDate: false,
  });
  console.log('   ✅ Anonymized DICOM saved\n');

  // Cache stats
  const stats = processor.getCacheStats();
  console.log(`5. Cache statistics:`);
  console.log(`   Cached files: ${stats.size}`);

  console.log('\n✅ DICOM processor demo completed!');
  console.log('\n💡 This demonstrates Python\'s pydicom library used directly in TypeScript!');
  console.log('   - Zero serialization overhead');
  console.log('   - Shared memory for pixel arrays');
  console.log('   - All in one process!');
}
