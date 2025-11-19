/**
 * Medical Image Segmentation
 *
 * Demonstrates organ segmentation, tumor detection, and region-based
 * segmentation using Python ML libraries directly in TypeScript!
 */

// @ts-ignore
import sitk from 'python:SimpleITK';
// @ts-ignore
import skimage from 'python:skimage';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

// ============================================================================
// Types
// ============================================================================

export interface SegmentationMask {
  mask: any; // NumPy array or SimpleITK image
  label: string;
  confidence: number;
  volume: number; // in mm³
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  centroid: [number, number, number];
}

export interface OrganSegmentationResult {
  organName: string;
  mask: any;
  volumeMl: number;
  confidence: number;
  abnormalities: Abnormality[];
}

export interface Abnormality {
  type: 'tumor' | 'lesion' | 'cyst' | 'calcification';
  location: [number, number, number];
  volume: number;
  intensity: number;
  suspicious: boolean;
}

export interface WatershedResult {
  segments: any;
  numRegions: number;
  regionSizes: number[];
}

// ============================================================================
// Medical Segmentation Class
// ============================================================================

export class MedicalSegmentation {
  /**
   * Segment liver from CT scan using thresholding + morphology
   *
   * This is a simplified algorithm - production systems use deep learning
   */
  async segmentLiver(image: any): Promise<SegmentationMask> {
    console.log('[Segmentation] Segmenting liver...');

    // Convert to array for processing
    const array = sitk.GetArrayFromImage(image);

    // Liver tissue is typically 40-60 HU in CT
    const lowerHU = 40;
    const upperHU = 60;

    // Threshold
    const mask = numpy.logical_and(array >= lowerHU, array <= upperHU);

    // Morphological operations to clean up
    const cleaned = scipy.ndimage.binary_closing(mask, iterations: 3);
    const filled = scipy.ndimage.binary_fill_holes(cleaned);

    // Find largest connected component (should be liver)
    const labeled = scipy.ndimage.label(filled)[0];
    const sizes = numpy.bincount(labeled.ravel());

    // Largest component (excluding background)
    const largestLabel = numpy.argmax(sizes[1:]) + 1;
    const liverMask = labeled === largestLabel;

    // Calculate volume
    const spacing = image.GetSpacing();
    const voxelVolume = spacing[0] * spacing[1] * spacing[2];
    const volumeMm3 = numpy.sum(liverMask) * voxelVolume;

    // Calculate centroid
    const centroid = scipy.ndimage.center_of_mass(liverMask);

    // Bounding box
    const coords = numpy.argwhere(liverMask);
    const minCoords = numpy.min(coords, axis: 0);
    const maxCoords = numpy.max(coords, axis: 0);

    console.log(`  Liver volume: ${(volumeMm3 / 1000).toFixed(1)} ml`);

    return {
      mask: liverMask,
      label: 'liver',
      confidence: 0.85,
      volume: volumeMm3,
      boundingBox: {
        min: Array.from(minCoords) as [number, number, number],
        max: Array.from(maxCoords) as [number, number, number],
      },
      centroid: Array.from(centroid) as [number, number, number],
    };
  }

  /**
   * Segment lungs from CT scan
   */
  async segmentLungs(image: any): Promise<SegmentationMask> {
    console.log('[Segmentation] Segmenting lungs...');

    const array = sitk.GetArrayFromImage(image);

    // Lungs are air-filled, very low HU values (typically -950 to -500)
    const lungMask = numpy.logical_and(array >= -950, array <= -500);

    // Remove trachea and airways (keep only two largest components)
    const labeled = scipy.ndimage.label(lungMask)[0];
    const sizes = numpy.bincount(labeled.ravel());

    // Find two largest components (left and right lung)
    const sortedLabels = numpy.argsort(sizes)[::-1];
    const leftLungLabel = sortedLabels[1];
    const rightLungLabel = sortedLabels[2];

    const lungs = numpy.logical_or(
      labeled === leftLungLabel,
      labeled === rightLungLabel
    );

    // Fill holes inside lungs
    const filled = scipy.ndimage.binary_fill_holes(lungs);

    // Calculate volume
    const spacing = image.GetSpacing();
    const voxelVolume = spacing[0] * spacing[1] * spacing[2];
    const volumeMm3 = numpy.sum(filled) * voxelVolume;

    const centroid = scipy.ndimage.center_of_mass(filled);
    const coords = numpy.argwhere(filled);
    const minCoords = numpy.min(coords, axis: 0);
    const maxCoords = numpy.max(coords, axis: 0);

    console.log(`  Lung volume: ${(volumeMm3 / 1000).toFixed(1)} ml`);

    return {
      mask: filled,
      label: 'lungs',
      confidence: 0.90,
      volume: volumeMm3,
      boundingBox: {
        min: Array.from(minCoords) as [number, number, number],
        max: Array.from(maxCoords) as [number, number, number],
      },
      centroid: Array.from(centroid) as [number, number, number],
    };
  }

  /**
   * Detect tumors within an organ mask
   */
  async detectTumors(
    image: any,
    organMask: any,
    options?: {
      minSize?: number;
      maxSize?: number;
      intensityThreshold?: number;
    }
  ): Promise<Abnormality[]> {
    console.log('[Segmentation] Detecting tumors...');

    const array = sitk.GetArrayFromImage(image);

    // Tumors typically have different intensity than surrounding tissue
    const maskedImage = array * organMask;

    // Calculate mean intensity within organ
    const organIntensities = maskedImage[organMask > 0];
    const meanIntensity = numpy.mean(organIntensities);
    const stdIntensity = numpy.std(organIntensities);

    // Find regions significantly different from mean
    const threshold = options?.intensityThreshold || (meanIntensity + 2 * stdIntensity);
    const suspiciousRegions = numpy.logical_and(
      maskedImage > threshold,
      organMask > 0
    );

    // Label connected components
    const labeled = scipy.ndimage.label(suspiciousRegions)[0];
    const numRegions = numpy.max(labeled);

    const tumors: Abnormality[] = [];
    const spacing = image.GetSpacing();
    const voxelVolume = spacing[0] * spacing[1] * spacing[2];

    const minSize = options?.minSize || 100; // mm³
    const maxSize = options?.maxSize || 50000; // mm³

    // Analyze each region
    for (let label = 1; label <= numRegions; label++) {
      const regionMask = labeled === label;
      const regionSize = numpy.sum(regionMask);
      const volumeMm3 = regionSize * voxelVolume;

      // Filter by size
      if (volumeMm3 < minSize || volumeMm3 > maxSize) {
        continue;
      }

      // Get location (centroid)
      const centroid = scipy.ndimage.center_of_mass(regionMask);

      // Get mean intensity
      const regionIntensity = numpy.mean(maskedImage[regionMask]);

      // Determine if suspicious based on intensity
      const suspicious = regionIntensity > (meanIntensity + 3 * stdIntensity);

      tumors.push({
        type: 'tumor',
        location: Array.from(centroid) as [number, number, number],
        volume: volumeMm3,
        intensity: regionIntensity,
        suspicious,
      });
    }

    console.log(`  Found ${tumors.length} potential tumors`);

    return tumors.sort((a, b) => b.volume - a.volume);
  }

  /**
   * Region growing segmentation
   *
   * Starting from seed points, grow regions with similar intensities
   */
  regionGrowing(
    image: any,
    seedPoints: Array<[number, number, number]>,
    options?: {
      lowerThreshold?: number;
      upperThreshold?: number;
    }
  ): any {
    console.log(`[Segmentation] Region growing from ${seedPoints.length} seeds...`);

    const filter = new sitk.ConnectedThresholdImageFilter();

    // Set seed points
    for (const seed of seedPoints) {
      filter.AddSeed(seed);
    }

    // Set thresholds
    filter.SetLower(options?.lowerThreshold || 0);
    filter.SetUpper(options?.upperThreshold || 255);

    const segmented = filter.Execute(image);

    console.log('  Region growing complete');

    return segmented;
  }

  /**
   * Watershed segmentation
   *
   * Uses scikit-image's watershed algorithm
   */
  watershedSegmentation(image: any, markers?: any): WatershedResult {
    console.log('[Segmentation] Watershed segmentation...');

    const array = sitk.GetArrayFromImage(image);

    // If no markers provided, generate them automatically
    if (!markers) {
      // Find local maxima as markers
      const localMax = skimage.feature.peak_local_max(
        array,
        min_distance: 10,
        indices: false
      );

      markers = scipy.ndimage.label(localMax)[0];
    }

    // Compute gradient
    const gradient = skimage.filters.sobel(array);

    // Run watershed
    const segments = skimage.segmentation.watershed(gradient, markers);

    // Analyze segments
    const numRegions = numpy.max(segments);
    const regionSizes: number[] = [];

    for (let i = 1; i <= numRegions; i++) {
      const size = numpy.sum(segments === i);
      regionSizes.push(size);
    }

    console.log(`  Found ${numRegions} regions`);

    return {
      segments,
      numRegions,
      regionSizes,
    };
  }

  /**
   * Active contour segmentation (snake)
   *
   * Uses scikit-image's active contour (snake) algorithm
   */
  activeContour(
    image: any,
    initialContour: Array<[number, number]>,
    options?: {
      alpha?: number;
      beta?: number;
      gamma?: number;
      iterations?: number;
    }
  ): Array<[number, number]> {
    console.log('[Segmentation] Active contour (snake) segmentation...');

    const array = sitk.GetArrayFromImage(image);

    // Convert initial contour to NumPy array
    const init = numpy.array(initialContour);

    // Run active contour
    const snake = skimage.segmentation.active_contour(
      array,
      init,
      alpha: options?.alpha || 0.015,
      beta: options?.beta || 10,
      gamma: options?.gamma || 0.001,
      max_iterations: options?.iterations || 2500
    );

    console.log('  Active contour converged');

    return Array.from(snake);
  }

  /**
   * Level set segmentation using SimpleITK
   */
  levelSetSegmentation(
    image: any,
    seedPoints: Array<[number, number, number]>,
    options?: {
      propagationScaling?: number;
      curvatureScaling?: number;
      iterations?: number;
    }
  ): any {
    console.log('[Segmentation] Level set segmentation...');

    // Initialize level set with seed points
    const initialLevelSet = sitk.Image(image.GetSize(), sitk.sitkFloat32);
    initialLevelSet.CopyInformation(image);

    for (const seed of seedPoints) {
      initialLevelSet.SetPixel(seed, -1.0);
    }

    // Create distance map
    const distanceMap = sitk.SignedMaurerDistanceMap(
      initialLevelSet > 0,
      insideIsPositive: false,
      squaredDistance: false,
      useImageSpacing: true
    );

    // Geodesic active contour
    const filter = new sitk.GeodesicActiveContourLevelSetImageFilter();
    filter.SetPropagationScaling(options?.propagationScaling || 1.0);
    filter.SetCurvatureScaling(options?.curvatureScaling || 1.0);
    filter.SetMaximumRMSError(0.02);
    filter.SetNumberOfIterations(options?.iterations || 100);

    const levelSet = filter.Execute(distanceMap, image);

    // Convert to binary mask
    const segmented = levelSet < 0;

    console.log(`  Level set iterations: ${filter.GetElapsedIterations()}`);

    return segmented;
  }

  /**
   * K-means clustering segmentation
   */
  kMeansClustering(image: any, numClusters: number = 3): any {
    console.log(`[Segmentation] K-means clustering (k=${numClusters})...`);

    const array = sitk.GetArrayFromImage(image);

    // Reshape to 2D for clustering
    const flat = array.reshape(-1, 1);

    // Use scikit-learn for k-means (would import sklearn if available)
    // For now, use simple numpy-based approach
    const min = numpy.min(array);
    const max = numpy.max(array);

    // Initialize centroids evenly spaced
    const centroids = numpy.linspace(min, max, numClusters);

    // Simple k-means iterations
    let labels = numpy.zeros_like(flat);

    for (let iter = 0; iter < 10; iter++) {
      // Assign to nearest centroid
      for (let i = 0; i < numClusters; i++) {
        const distances = numpy.abs(flat - centroids[i]);
        labels[distances === numpy.min(numpy.abs(flat - centroids.reshape(-1, 1)), axis: 0)] = i;
      }

      // Update centroids
      for (let i = 0; i < numClusters; i++) {
        const clusterPoints = flat[labels === i];
        if (clusterPoints.length > 0) {
          centroids[i] = numpy.mean(clusterPoints);
        }
      }
    }

    // Reshape back to original shape
    const clustered = labels.reshape(array.shape);

    console.log('  K-means clustering complete');

    return clustered;
  }

  /**
   * Calculate volume of segmentation mask
   */
  calculateVolume(mask: any, spacing: [number, number, number]): number {
    const numVoxels = numpy.sum(mask);
    const voxelVolume = spacing[0] * spacing[1] * spacing[2];
    const volumeMm3 = numVoxels * voxelVolume;
    const volumeMl = volumeMm3 / 1000;

    return volumeMl;
  }

  /**
   * Calculate surface area of segmentation
   */
  calculateSurfaceArea(mask: any, spacing: [number, number, number]): number {
    // Find surface voxels (voxels adjacent to background)
    const structure = numpy.ones([3, 3, 3]);
    const eroded = scipy.ndimage.binary_erosion(mask, structure: structure);
    const surface = numpy.logical_xor(mask, eroded);

    const numSurfaceVoxels = numpy.sum(surface);
    const voxelSurfaceArea = 2 * (
      spacing[0] * spacing[1] +
      spacing[1] * spacing[2] +
      spacing[0] * spacing[2]
    );

    return numSurfaceVoxels * voxelSurfaceArea;
  }

  /**
   * Segment all major organs (comprehensive pipeline)
   */
  async segmentAllOrgans(image: any): Promise<OrganSegmentationResult[]> {
    console.log('[Segmentation] Running comprehensive organ segmentation...\n');

    const results: OrganSegmentationResult[] = [];

    // Segment liver
    try {
      const liver = await this.segmentLiver(image);
      const tumors = await this.detectTumors(image, liver.mask);

      results.push({
        organName: 'liver',
        mask: liver.mask,
        volumeMl: liver.volume / 1000,
        confidence: liver.confidence,
        abnormalities: tumors,
      });
    } catch (error) {
      console.error('  Error segmenting liver:', error);
    }

    // Segment lungs
    try {
      const lungs = await this.segmentLungs(image);

      results.push({
        organName: 'lungs',
        mask: lungs.mask,
        volumeMl: lungs.volume / 1000,
        confidence: lungs.confidence,
        abnormalities: [],
      });
    } catch (error) {
      console.error('  Error segmenting lungs:', error);
    }

    console.log(`\n  Segmented ${results.length} organs`);

    return results;
  }

  /**
   * Overlay segmentation on image for visualization
   */
  overlaySegmentation(
    image: any,
    mask: any,
    color: [number, number, number] = [255, 0, 0],
    alpha: number = 0.5
  ): any {
    const imageArray = sitk.GetArrayFromImage(image);

    // Normalize image to 0-255
    const normalized = (imageArray - numpy.min(imageArray)) / (numpy.max(imageArray) - numpy.min(imageArray)) * 255;

    // Create RGB image
    const rgb = numpy.stack([normalized, normalized, normalized], axis: -1);

    // Apply colored overlay where mask is true
    const overlay = rgb.copy();
    overlay[mask] = overlay[mask] * (1 - alpha) + numpy.array(color) * alpha;

    return overlay;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export async function segmentOrgan(
  image: any,
  organName: 'liver' | 'lungs'
): Promise<SegmentationMask> {
  const segmenter = new MedicalSegmentation();

  if (organName === 'liver') {
    return segmenter.segmentLiver(image);
  } else if (organName === 'lungs') {
    return segmenter.segmentLungs(image);
  }

  throw new Error(`Unknown organ: ${organName}`);
}

export async function detectTumors(
  image: any,
  organMask: any
): Promise<Abnormality[]> {
  const segmenter = new MedicalSegmentation();
  return segmenter.detectTumors(image, organMask);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎯 Medical Segmentation Demo\n');

  // Create synthetic CT scan
  console.log('Creating synthetic CT scan...\n');

  const size = [128, 128, 64];

  // Create background (soft tissue ~40 HU)
  const ct = numpy.ones(size) * 40 + numpy.random.randn(...size) * 10;

  // Add liver-like structure (50-60 HU)
  const liverRegion = numpy.zeros(size);
  liverRegion[40:80, 40:80, 20:50] = 1;
  ct[liverRegion > 0] = 55 + numpy.random.randn(numpy.sum(liverRegion)) * 5;

  // Add lungs (-900 to -700 HU)
  const lungRegionLeft = numpy.zeros(size);
  lungRegionLeft[20:60, 10:40, 25:45] = 1;
  ct[lungRegionLeft > 0] = -800 + numpy.random.randn(numpy.sum(lungRegionLeft)) * 50;

  const lungRegionRight = numpy.zeros(size);
  lungRegionRight[20:60, 88:118, 25:45] = 1;
  ct[lungRegionRight > 0] = -800 + numpy.random.randn(numpy.sum(lungRegionRight)) * 50;

  // Convert to SimpleITK image
  const image = sitk.GetImageFromArray(ct);
  image.SetSpacing([1.0, 1.0, 2.0]); // mm

  console.log(`CT scan created: ${size.join('x')} voxels\n`);

  const segmenter = new MedicalSegmentation();

  // 1. Segment liver
  console.log('1. Liver Segmentation:');
  const liver = await segmenter.segmentLiver(image);
  console.log(`   Volume: ${(liver.volume / 1000).toFixed(1)} ml`);
  console.log(`   Centroid: ${liver.centroid.map(c => c.toFixed(1)).join(', ')}`);
  console.log(`   Confidence: ${(liver.confidence * 100).toFixed(0)}%\n`);

  // 2. Detect tumors
  console.log('2. Tumor Detection:');
  const tumors = await segmenter.detectTumors(image, liver.mask);
  console.log(`   Found: ${tumors.length} potential tumors`);
  for (const tumor of tumors.slice(0, 3)) {
    console.log(`     - Volume: ${tumor.volume.toFixed(1)} mm³, Suspicious: ${tumor.suspicious}`);
  }
  console.log();

  // 3. Segment lungs
  console.log('3. Lung Segmentation:');
  const lungs = await segmenter.segmentLungs(image);
  console.log(`   Volume: ${(lungs.volume / 1000).toFixed(1)} ml`);
  console.log(`   Confidence: ${(lungs.confidence * 100).toFixed(0)}%\n`);

  // 4. Watershed segmentation
  console.log('4. Watershed Segmentation:');
  const watershed = segmenter.watershedSegmentation(image);
  console.log(`   Regions: ${watershed.numRegions}`);
  console.log(`   Avg region size: ${(numpy.mean(watershed.regionSizes)).toFixed(0)} voxels\n`);

  // 5. Calculate metrics
  console.log('5. Segmentation Metrics:');
  const liverVolume = segmenter.calculateVolume(liver.mask, [1.0, 1.0, 2.0]);
  const liverSurface = segmenter.calculateSurfaceArea(liver.mask, [1.0, 1.0, 2.0]);
  console.log(`   Liver volume: ${liverVolume.toFixed(1)} ml`);
  console.log(`   Liver surface area: ${(liverSurface / 100).toFixed(1)} cm²\n`);

  console.log('✅ Medical segmentation demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - Organ segmentation algorithms');
  console.log('   - Tumor detection with scipy');
  console.log('   - Watershed and region growing');
  console.log('   - Python medical libs in TypeScript');
  console.log('   - Zero-copy NumPy arrays!');
}
