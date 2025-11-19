/**
 * Medical Image 3D Visualization
 *
 * Demonstrates 3D rendering, surface extraction, and multi-planar
 * reconstruction using Python visualization libraries in TypeScript!
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sitk from 'python:SimpleITK';
// @ts-ignore
import skimage from 'python:skimage';

// ============================================================================
// Types
// ============================================================================

export interface VolumeRenderOptions {
  colormap?: string;
  opacity?: number[];
  windowLevel?: { center: number; width: number };
  quality?: 'low' | 'medium' | 'high';
}

export interface SliceView {
  axial: any;
  sagittal: any;
  coronal: any;
}

export interface SurfaceMesh {
  vertices: number[][];
  faces: number[][];
  normals: number[][];
  numVertices: number;
  numFaces: number;
}

export interface MeasurementResult {
  type: 'distance' | 'angle' | 'area' | 'volume';
  value: number;
  unit: string;
  points: Array<[number, number, number]>;
}

// ============================================================================
// Volume Visualizer Class
// ============================================================================

export class VolumeVisualizer {
  /**
   * Load volume from DICOM series directory
   */
  async loadVolume(seriesPath: string): Promise<any> {
    console.log(`[Viz] Loading volume from ${seriesPath}...`);

    // In production, would scan directory and load all DICOM files
    // For now, create synthetic volume
    const volume = numpy.random.rand(128, 128, 64) * 1000;

    console.log(`  Volume shape: ${volume.shape}`);

    return volume;
  }

  /**
   * Get multi-planar reconstruction (MPR) views
   *
   * Generates axial, sagittal, and coronal slices
   */
  getMultiplanarViews(volume: any, sliceIndices?: {
    axial?: number;
    sagittal?: number;
    coronal?: number;
  }): SliceView {
    console.log('[Viz] Generating multi-planar views...');

    const shape = volume.shape;

    // Default to middle slices
    const axialIdx = sliceIndices?.axial ?? Math.floor(shape[0] / 2);
    const sagittalIdx = sliceIndices?.sagittal ?? Math.floor(shape[1] / 2);
    const coronalIdx = sliceIndices?.coronal ?? Math.floor(shape[2] / 2);

    // Extract slices
    const axial = volume[axialIdx, :, :];
    const sagittal = volume[:, sagittalIdx, :];
    const coronal = volume[:, :, coronalIdx];

    console.log(`  Axial: slice ${axialIdx}/${shape[0]}`);
    console.log(`  Sagittal: slice ${sagittalIdx}/${shape[1]}`);
    console.log(`  Coronal: slice ${coronalIdx}/${shape[2]}`);

    return {
      axial,
      sagittal,
      coronal
    };
  }

  /**
   * Apply window/level for visualization
   */
  applyWindowLevel(volume: any, center: number, width: number): any {
    console.log(`[Viz] Applying window/level (C=${center}, W=${width})...`);

    const lower = center - width / 2;
    const upper = center + width / 2;

    // Clip and normalize
    const windowed = numpy.clip(volume, lower, upper);
    const normalized = (windowed - lower) / width;

    return normalized;
  }

  /**
   * Apply colormap to volume
   */
  applyColormap(volume: any, colormap: string = 'gray'): any {
    console.log(`[Viz] Applying ${colormap} colormap...`);

    // Normalize to 0-255
    const normalized = (volume - numpy.min(volume)) / (numpy.max(volume) - numpy.min(volume)) * 255;
    const uint8 = numpy.uint8(normalized);

    // In production, would use matplotlib.cm or custom colormaps
    // For demo, return grayscale
    return uint8;
  }

  /**
   * Extract isosurface using marching cubes algorithm
   *
   * Uses scikit-image's marching_cubes to generate 3D surface mesh
   */
  extractSurface(volume: any, threshold: number, spacing?: [number, number, number]): SurfaceMesh {
    console.log(`[Viz] Extracting isosurface (threshold=${threshold})...`);

    const voxelSpacing = spacing || [1.0, 1.0, 1.0];

    // Use scikit-image's marching cubes directly in TypeScript!
    const [vertices, faces, normals, values] = skimage.measure.marching_cubes(
      volume,
      level: threshold,
      spacing: voxelSpacing
    );

    const numVertices = vertices.shape[0];
    const numFaces = faces.shape[0];

    console.log(`  Generated ${numVertices} vertices, ${numFaces} faces`);

    return {
      vertices: Array.from(vertices),
      faces: Array.from(faces),
      normals: Array.from(normals),
      numVertices,
      numFaces
    };
  }

  /**
   * Save mesh to STL file for 3D printing
   */
  saveMesh(mesh: SurfaceMesh, outputPath: string): void {
    console.log(`[Viz] Saving mesh to ${outputPath}...`);

    // In production, would write actual STL file
    // For demo, just log
    console.log(`  Would save ${mesh.numFaces} triangles to STL`);
  }

  /**
   * Create maximum intensity projection (MIP)
   */
  maximumIntensityProjection(volume: any, axis: number = 0): any {
    console.log(`[Viz] Computing MIP along axis ${axis}...`);

    // Take maximum along specified axis
    const mip = numpy.max(volume, axis: axis);

    console.log(`  MIP shape: ${mip.shape}`);

    return mip;
  }

  /**
   * Create minimum intensity projection (MinIP)
   */
  minimumIntensityProjection(volume: any, axis: number = 0): any {
    console.log(`[Viz] Computing MinIP along axis ${axis}...`);

    const minip = numpy.min(volume, axis: axis);

    return minip;
  }

  /**
   * Create average intensity projection (AIP)
   */
  averageIntensityProjection(volume: any, axis: number = 0): any {
    console.log(`[Viz] Computing AIP along axis ${axis}...`);

    const aip = numpy.mean(volume, axis: axis);

    return aip;
  }

  /**
   * Measure distance between two points
   */
  measureDistance(
    point1: [number, number, number],
    point2: [number, number, number],
    spacing: [number, number, number] = [1, 1, 1]
  ): MeasurementResult {
    // Apply voxel spacing
    const p1 = numpy.array(point1) * numpy.array(spacing);
    const p2 = numpy.array(point2) * numpy.array(spacing);

    // Euclidean distance
    const distance = numpy.linalg.norm(p2 - p1);

    console.log(`[Viz] Distance: ${Number(distance).toFixed(2)} mm`);

    return {
      type: 'distance',
      value: Number(distance),
      unit: 'mm',
      points: [point1, point2]
    };
  }

  /**
   * Measure angle between three points
   */
  measureAngle(
    point1: [number, number, number],
    vertex: [number, number, number],
    point2: [number, number, number]
  ): MeasurementResult {
    // Vectors from vertex to each point
    const v1 = numpy.array(point1) - numpy.array(vertex);
    const v2 = numpy.array(point2) - numpy.array(vertex);

    // Angle using dot product
    const cosAngle = numpy.dot(v1, v2) / (numpy.linalg.norm(v1) * numpy.linalg.norm(v2));
    const angleRad = numpy.arccos(numpy.clip(cosAngle, -1, 1));
    const angleDeg = Number(angleRad) * 180 / Math.PI;

    console.log(`[Viz] Angle: ${angleDeg.toFixed(1)}°`);

    return {
      type: 'angle',
      value: angleDeg,
      unit: 'degrees',
      points: [point1, vertex, point2]
    };
  }

  /**
   * Calculate volume of segmentation
   */
  measureVolume(mask: any, spacing: [number, number, number]): MeasurementResult {
    const numVoxels = numpy.sum(mask);
    const voxelVolume = spacing[0] * spacing[1] * spacing[2];
    const volumeMm3 = numVoxels * voxelVolume;
    const volumeMl = volumeMm3 / 1000;

    console.log(`[Viz] Volume: ${volumeMl.toFixed(1)} ml`);

    return {
      type: 'volume',
      value: volumeMl,
      unit: 'ml',
      points: []
    };
  }

  /**
   * Create curved planar reformation (CPR)
   *
   * Follows a curved path through the volume (e.g., along a vessel)
   */
  curvedPlanarReformation(
    volume: any,
    centerline: Array<[number, number, number]>,
    width: number = 20
  ): any {
    console.log(`[Viz] Creating CPR with ${centerline.length} points...`);

    // In production, would implement full CPR algorithm
    // For demo, create synthetic result
    const cprHeight = centerline.length;
    const cpr = numpy.zeros([cprHeight, width]);

    console.log(`  CPR shape: ${cpr.shape}`);

    return cpr;
  }

  /**
   * Create thick slab MIP
   *
   * MIP over a slab (multiple slices) rather than entire volume
   */
  thickSlabMIP(
    volume: any,
    startSlice: number,
    endSlice: number,
    axis: number = 0
  ): any {
    console.log(`[Viz] Thick slab MIP (slices ${startSlice}-${endSlice})...`);

    // Extract slab
    let slab: any;
    if (axis === 0) {
      slab = volume[startSlice:endSlice, :, :];
    } else if (axis === 1) {
      slab = volume[:, startSlice:endSlice, :];
    } else {
      slab = volume[:, :, startSlice:endSlice];
    }

    // MIP over slab
    const mip = numpy.max(slab, axis: axis);

    return mip;
  }

  /**
   * Apply 3D Gaussian smoothing for better visualization
   */
  smoothVolume(volume: any, sigma: number = 1.0): any {
    console.log(`[Viz] Smoothing volume (sigma=${sigma})...`);

    // @ts-ignore
    const scipy = await import('python:scipy');
    const smoothed = scipy.ndimage.gaussian_filter(volume, sigma: sigma);

    return smoothed;
  }

  /**
   * Downsample volume for faster rendering
   */
  downsampleVolume(volume: any, factor: number = 2): any {
    console.log(`[Viz] Downsampling by factor ${factor}...`);

    const downsampled = volume[::factor, ::factor, ::factor];

    console.log(`  New shape: ${downsampled.shape}`);

    return downsampled;
  }

  /**
   * Create annotation overlay
   */
  addAnnotations(
    image: any,
    annotations: Array<{
      type: 'arrow' | 'circle' | 'text';
      position: [number, number];
      label?: string;
      size?: number;
    }>
  ): any {
    console.log(`[Viz] Adding ${annotations.length} annotations...`);

    // In production, would draw annotations on image
    // For demo, return image unchanged
    return image;
  }

  /**
   * Create side-by-side comparison view
   */
  createComparisonView(image1: any, image2: any): any {
    console.log('[Viz] Creating comparison view...');

    // Concatenate images horizontally
    const comparison = numpy.concatenate([image1, image2], axis: 1);

    console.log(`  Comparison shape: ${comparison.shape}`);

    return comparison;
  }

  /**
   * Export visualization as image
   */
  async exportImage(
    data: any,
    outputPath: string,
    format: 'png' | 'jpg' | 'tiff' = 'png'
  ): Promise<void> {
    console.log(`[Viz] Exporting to ${outputPath}...`);

    // @ts-ignore
    const PIL = await import('python:PIL');
    const Image = PIL.Image;

    // Normalize to 0-255
    const normalized = (data - numpy.min(data)) / (numpy.max(data) - numpy.min(data)) * 255;
    const uint8 = numpy.uint8(normalized);

    // Create and save image
    const image = Image.fromarray(uint8);
    image.save(outputPath);

    console.log('  Export complete');
  }

  /**
   * Generate thumbnail preview
   */
  generateThumbnail(volume: any, size: number = 128): any {
    console.log(`[Viz] Generating ${size}x${size} thumbnail...`);

    // Get middle slice
    const midSlice = Math.floor(volume.shape[0] / 2);
    const slice = volume[midSlice, :, :];

    // Resize
    // @ts-ignore
    const skimage = await import('python:skimage');
    const thumbnail = skimage.transform.resize(slice, [size, size]);

    return thumbnail;
  }
}

// ============================================================================
// Interactive Viewer (Web-based)
// ============================================================================

export class InteractiveViewer {
  private volume: any;
  private currentSliceIndex: number = 0;

  constructor(volume: any) {
    this.volume = volume;
    this.currentSliceIndex = Math.floor(volume.shape[0] / 2);
  }

  /**
   * Navigate to next slice
   */
  nextSlice(): any {
    const maxIdx = this.volume.shape[0] - 1;
    this.currentSliceIndex = Math.min(this.currentSliceIndex + 1, maxIdx);

    console.log(`[Viewer] Slice ${this.currentSliceIndex}/${maxIdx}`);

    return this.getCurrentSlice();
  }

  /**
   * Navigate to previous slice
   */
  previousSlice(): any {
    this.currentSliceIndex = Math.max(this.currentSliceIndex - 1, 0);

    console.log(`[Viewer] Slice ${this.currentSliceIndex}/${this.volume.shape[0] - 1}`);

    return this.getCurrentSlice();
  }

  /**
   * Jump to specific slice
   */
  gotoSlice(index: number): any {
    const maxIdx = this.volume.shape[0] - 1;
    this.currentSliceIndex = Math.max(0, Math.min(index, maxIdx));

    console.log(`[Viewer] Jumped to slice ${this.currentSliceIndex}`);

    return this.getCurrentSlice();
  }

  /**
   * Get current slice
   */
  getCurrentSlice(): any {
    return this.volume[this.currentSliceIndex, :, :];
  }

  /**
   * Zoom in/out on current view
   */
  zoom(factor: number): any {
    console.log(`[Viewer] Zoom: ${factor}x`);

    const slice = this.getCurrentSlice();

    // In production, would implement proper zoom
    // For demo, just return slice
    return slice;
  }

  /**
   * Pan view
   */
  pan(dx: number, dy: number): any {
    console.log(`[Viewer] Pan: (${dx}, ${dy})`);

    // In production, would adjust viewport
    return this.getCurrentSlice();
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function extractSurface(volume: any, threshold: number): SurfaceMesh {
  const viz = new VolumeVisualizer();
  return viz.extractSurface(volume, threshold);
}

export function getMultiplanarViews(volume: any): SliceView {
  const viz = new VolumeVisualizer();
  return viz.getMultiplanarViews(volume);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('📊 3D Visualization Demo\n');

  const viz = new VolumeVisualizer();

  // Create synthetic CT volume
  console.log('Creating synthetic CT volume...\n');

  const volume = numpy.random.rand(128, 128, 64) * 1000;

  // Add synthetic organ (sphere)
  for (let z = 0; z < 64; z++) {
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const dx = x - 64;
        const dy = y - 64;
        const dz = z - 32;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 25) {
          volume[z][y][x] = 800;
        }
      }
    }
  }

  console.log(`Volume shape: ${volume.shape}\n`);

  // 1. Multi-planar views
  console.log('1. Multi-Planar Reconstruction:');
  const mpr = viz.getMultiplanarViews(volume);
  console.log(`   Axial: ${mpr.axial.shape}`);
  console.log(`   Sagittal: ${mpr.sagittal.shape}`);
  console.log(`   Coronal: ${mpr.coronal.shape}\n`);

  // 2. Projections
  console.log('2. Intensity Projections:');
  const mip = viz.maximumIntensityProjection(volume, 0);
  console.log(`   MIP shape: ${mip.shape}`);

  const aip = viz.averageIntensityProjection(volume, 0);
  console.log(`   AIP shape: ${aip.shape}\n`);

  // 3. Surface extraction
  console.log('3. Isosurface Extraction:');
  const mesh = viz.extractSurface(volume, 700, [1.0, 1.0, 2.0]);
  console.log(`   Vertices: ${mesh.numVertices}`);
  console.log(`   Faces: ${mesh.numFaces}\n`);

  // 4. Measurements
  console.log('4. Measurements:');
  const distance = viz.measureDistance([10, 10, 10], [50, 50, 30], [1, 1, 2]);
  console.log(`   Distance: ${distance.value.toFixed(2)} ${distance.unit}`);

  const angle = viz.measureAngle([0, 0, 0], [10, 10, 10], [20, 0, 0]);
  console.log(`   Angle: ${angle.value.toFixed(1)} ${angle.unit}\n`);

  // 5. Interactive viewer
  console.log('5. Interactive Viewer:');
  const viewer = new InteractiveViewer(volume);
  viewer.nextSlice();
  viewer.nextSlice();
  viewer.previousSlice();
  viewer.gotoSlice(30);
  console.log();

  console.log('✅ Visualization demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - Multi-planar reconstruction');
  console.log('   - Marching cubes surface extraction');
  console.log('   - MIP/MinIP/AIP projections');
  console.log('   - 3D measurements');
  console.log('   - Interactive viewing');
  console.log('   - All using Python libs in TypeScript!');
}
