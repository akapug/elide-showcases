/**
 * Image Analysis - Medical image processing with SimpleITK and scikit-image
 *
 * This demonstrates using Python's SimpleITK and scikit-image directly in
 * TypeScript for advanced medical image analysis - impossible without Elide!
 */

// @ts-ignore - Python medical image processing library
import sitk from 'python:SimpleITK';
// @ts-ignore - Python image processing library
import skimage from 'python:skimage';
// @ts-ignore - Python numerical computing
import numpy from 'python:numpy';
// @ts-ignore - Python scientific computing
import scipy from 'python:scipy';

// ============================================================================
// Types
// ============================================================================

export interface ImageStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  std: number;
  variance: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  percentile99: number;
}

export interface FilterOptions {
  sigma?: number;
  radius?: number;
  kernel?: number;
  iterations?: number;
}

export interface RegistrationResult {
  transformedImage: any;
  transformMatrix: number[][];
  similarity: number;
  iterations: number;
  convergence: boolean;
}

// ============================================================================
// Image Analyzer Class
// ============================================================================

export class ImageAnalyzer {
  /**
   * Load image from file using SimpleITK
   *
   * SimpleITK can read DICOM, NIfTI, NRRD, and many other medical formats
   */
  loadImage(filepath: string): any {
    console.log(`[Analysis] Loading image: ${filepath}`);

    try {
      // Use Python's SimpleITK.ReadImage() directly in TypeScript!
      const image = sitk.ReadImage(filepath);

      const size = image.GetSize();
      const spacing = image.GetSpacing();
      const origin = image.GetOrigin();

      console.log(`[Analysis] Image loaded:`);
      console.log(`  Size: ${size}`);
      console.log(`  Spacing: ${spacing}`);
      console.log(`  Origin: ${origin}`);

      return image;
    } catch (error) {
      console.error(`[Analysis] Error loading image:`, error);
      throw error;
    }
  }

  /**
   * Convert SimpleITK image to NumPy array
   */
  imageToArray(image: any): any {
    return sitk.GetArrayFromImage(image);
  }

  /**
   * Convert NumPy array to SimpleITK image
   */
  arrayToImage(array: any, spacing?: number[], origin?: number[]): any {
    const image = sitk.GetImageFromArray(array);

    if (spacing) {
      image.SetSpacing(spacing);
    }
    if (origin) {
      image.SetOrigin(origin);
    }

    return image;
  }

  /**
   * Save image to file
   */
  saveImage(image: any, filepath: string): void {
    sitk.WriteImage(image, filepath);
    console.log(`[Analysis] Image saved: ${filepath}`);
  }

  // ============================================================================
  // Statistical Analysis
  // ============================================================================

  /**
   * Calculate comprehensive image statistics
   *
   * Uses both NumPy and SciPy for statistical analysis!
   */
  getStatistics(image: any): ImageStatistics {
    const array = this.imageToArray(image);

    // Use NumPy functions directly!
    return {
      min: Number(numpy.min(array)),
      max: Number(numpy.max(array)),
      mean: Number(numpy.mean(array)),
      median: Number(numpy.median(array)),
      std: Number(numpy.std(array)),
      variance: Number(numpy.var(array)),
      percentile25: Number(numpy.percentile(array, 25)),
      percentile75: Number(numpy.percentile(array, 75)),
      percentile95: Number(numpy.percentile(array, 95)),
      percentile99: Number(numpy.percentile(array, 99)),
    };
  }

  /**
   * Calculate histogram
   */
  getHistogram(image: any, bins: number = 256): { bins: number[]; counts: number[] } {
    const array = this.imageToArray(image);

    // Use NumPy histogram directly!
    const [counts, binEdges] = numpy.histogram(array, bins: bins);

    return {
      bins: Array.from(binEdges),
      counts: Array.from(counts),
    };
  }

  // ============================================================================
  // Filtering Operations
  // ============================================================================

  /**
   * Gaussian smoothing filter
   *
   * Uses SimpleITK's GaussianImageFilter in TypeScript!
   */
  gaussianSmooth(image: any, sigma: number = 1.0): any {
    console.log(`[Analysis] Applying Gaussian smoothing (sigma=${sigma})...`);

    // Use SimpleITK filter directly!
    const filter = new sitk.SmoothingRecursiveGaussianImageFilter();
    filter.SetSigma(sigma);

    const smoothed = filter.Execute(image);
    return smoothed;
  }

  /**
   * Median filter (noise reduction)
   */
  medianFilter(image: any, radius: number = 1): any {
    console.log(`[Analysis] Applying median filter (radius=${radius})...`);

    const filter = new sitk.MedianImageFilter();
    filter.SetRadius(radius);

    return filter.Execute(image);
  }

  /**
   * Bilateral filter (edge-preserving smoothing)
   */
  bilateralFilter(
    image: any,
    options?: { domainSigma?: number; rangeSigma?: number }
  ): any {
    console.log('[Analysis] Applying bilateral filter...');

    const filter = new sitk.BilateralImageFilter();
    filter.SetDomainSigma(options?.domainSigma || 2.0);
    filter.SetRangeSigma(options?.rangeSigma || 50.0);

    return filter.Execute(image);
  }

  /**
   * Anisotropic diffusion filter (edge-preserving, noise reduction)
   */
  anisotropicDiffusion(
    image: any,
    options?: { timeStep?: number; iterations?: number }
  ): any {
    console.log('[Analysis] Applying anisotropic diffusion...');

    const filter = new sitk.CurvatureAnisotropicDiffusionImageFilter();
    filter.SetTimeStep(options?.timeStep || 0.0625);
    filter.SetNumberOfIterations(options?.iterations || 5);

    return filter.Execute(image);
  }

  // ============================================================================
  // Edge Detection
  // ============================================================================

  /**
   * Canny edge detection using scikit-image
   */
  detectEdgesCanny(image: any, sigma: number = 1.0): any {
    console.log(`[Analysis] Canny edge detection (sigma=${sigma})...`);

    const array = this.imageToArray(image);

    // Use scikit-image's Canny edge detector directly!
    const edges = skimage.feature.canny(array, sigma: sigma);

    return this.arrayToImage(edges);
  }

  /**
   * Sobel edge detection
   */
  detectEdgesSobel(image: any): any {
    console.log('[Analysis] Sobel edge detection...');

    const array = this.imageToArray(image);

    // Use scikit-image's Sobel filter
    const edges = skimage.filters.sobel(array);

    return this.arrayToImage(edges);
  }

  /**
   * Laplacian of Gaussian edge detection
   */
  detectEdgesLoG(image: any, sigma: number = 1.0): any {
    console.log(`[Analysis] LoG edge detection (sigma=${sigma})...`);

    const array = this.imageToArray(image);

    // Use scikit-image's LoG filter
    const edges = skimage.filters.laplace(skimage.filters.gaussian(array, sigma: sigma));

    return this.arrayToImage(edges);
  }

  // ============================================================================
  // Image Enhancement
  // ============================================================================

  /**
   * Histogram equalization
   */
  equalizeHistogram(image: any): any {
    console.log('[Analysis] Histogram equalization...');

    const array = this.imageToArray(image);

    // Use scikit-image's histogram equalization
    const equalized = skimage.exposure.equalize_hist(array);

    return this.arrayToImage(equalized);
  }

  /**
   * Adaptive histogram equalization (CLAHE)
   */
  clahe(image: any, clipLimit: number = 0.01): any {
    console.log('[Analysis] CLAHE enhancement...');

    const array = this.imageToArray(image);

    // Use scikit-image's CLAHE
    const enhanced = skimage.exposure.equalize_adapthist(array, clip_limit: clipLimit);

    return this.arrayToImage(enhanced);
  }

  /**
   * Contrast stretching
   */
  stretchContrast(image: any, pMin: number = 2, pMax: number = 98): any {
    console.log(`[Analysis] Contrast stretching (${pMin}%, ${pMax}%)...`);

    const array = this.imageToArray(image);

    // Calculate percentiles
    const vMin = numpy.percentile(array, pMin);
    const vMax = numpy.percentile(array, pMax);

    // Rescale intensity
    const stretched = skimage.exposure.rescale_intensity(
      array,
      in_range: (vMin, vMax),
      out_range: (0, 1)
    );

    return this.arrayToImage(stretched);
  }

  /**
   * Sharpen image using unsharp masking
   */
  sharpen(image: any, radius: number = 1.0, amount: number = 1.0): any {
    console.log('[Analysis] Sharpening image...');

    const array = this.imageToArray(image);

    // Use scikit-image's unsharp mask
    const sharpened = skimage.filters.unsharp_mask(
      array,
      radius: radius,
      amount: amount
    );

    return this.arrayToImage(sharpened);
  }

  // ============================================================================
  // Morphological Operations
  // ============================================================================

  /**
   * Binary erosion
   */
  erode(image: any, radius: number = 1): any {
    console.log(`[Analysis] Erosion (radius=${radius})...`);

    const filter = new sitk.BinaryErodeImageFilter();
    filter.SetKernelRadius(radius);

    return filter.Execute(image);
  }

  /**
   * Binary dilation
   */
  dilate(image: any, radius: number = 1): any {
    console.log(`[Analysis] Dilation (radius=${radius})...`);

    const filter = new sitk.BinaryDilateImageFilter();
    filter.SetKernelRadius(radius);

    return filter.Execute(image);
  }

  /**
   * Morphological opening (erosion followed by dilation)
   */
  morphologicalOpening(image: any, radius: number = 1): any {
    console.log(`[Analysis] Morphological opening (radius=${radius})...`);

    const filter = new sitk.BinaryMorphologicalOpeningImageFilter();
    filter.SetKernelRadius(radius);

    return filter.Execute(image);
  }

  /**
   * Morphological closing (dilation followed by erosion)
   */
  morphologicalClosing(image: any, radius: number = 1): any {
    console.log(`[Analysis] Morphological closing (radius=${radius})...`);

    const filter = new sitk.BinaryMorphologicalClosingImageFilter();
    filter.SetKernelRadius(radius);

    return filter.Execute(image);
  }

  // ============================================================================
  // Thresholding
  // ============================================================================

  /**
   * Otsu's automatic thresholding
   */
  thresholdOtsu(image: any): any {
    console.log('[Analysis] Otsu thresholding...');

    const filter = new sitk.OtsuThresholdImageFilter();
    const thresholded = filter.Execute(image);

    const threshold = filter.GetThreshold();
    console.log(`  Threshold value: ${threshold}`);

    return thresholded;
  }

  /**
   * Binary threshold
   */
  thresholdBinary(
    image: any,
    lowerThreshold: number,
    upperThreshold: number,
    insideValue: number = 1,
    outsideValue: number = 0
  ): any {
    console.log(`[Analysis] Binary threshold (${lowerThreshold}-${upperThreshold})...`);

    const filter = new sitk.BinaryThresholdImageFilter();
    filter.SetLowerThreshold(lowerThreshold);
    filter.SetUpperThreshold(upperThreshold);
    filter.SetInsideValue(insideValue);
    filter.SetOutsideValue(outsideValue);

    return filter.Execute(image);
  }

  // ============================================================================
  // Image Registration
  // ============================================================================

  /**
   * Rigid registration (translation + rotation)
   *
   * Aligns two images using mutual information
   */
  registerRigid(fixedImage: any, movingImage: any): RegistrationResult {
    console.log('[Analysis] Performing rigid registration...');

    // Create registration method
    const registration = new sitk.ImageRegistrationMethod();

    // Similarity metric
    registration.SetMetricAsMattesMutualInformation(numberOfHistogramBins: 50);
    registration.SetMetricSamplingStrategy(registration.RANDOM);
    registration.SetMetricSamplingPercentage(0.01);

    // Optimizer
    registration.SetOptimizerAsRegularStepGradientDescent(
      learningRate: 1.0,
      minStep: 0.001,
      numberOfIterations: 200
    );

    // Interpolator
    registration.SetInterpolator(sitk.sitkLinear);

    // Initial transform
    const initialTransform = sitk.CenteredTransformInitializer(
      fixedImage,
      movingImage,
      new sitk.Euler3DTransform(),
      sitk.CenteredTransformInitializerFilter.GEOMETRY
    );

    registration.SetInitialTransform(initialTransform);

    // Execute registration
    const finalTransform = registration.Execute(fixedImage, movingImage);

    // Apply transform to moving image
    const resampler = new sitk.ResampleImageFilter();
    resampler.SetReferenceImage(fixedImage);
    resampler.SetInterpolator(sitk.sitkLinear);
    resampler.SetDefaultPixelValue(0);
    resampler.SetTransform(finalTransform);

    const transformedImage = resampler.Execute(movingImage);

    // Get similarity metric
    const finalMetric = registration.GetMetricValue();

    console.log(`  Final metric: ${finalMetric}`);
    console.log(`  Optimizer iterations: ${registration.GetOptimizerIteration()}`);

    return {
      transformedImage,
      transformMatrix: [], // Would extract from finalTransform in production
      similarity: finalMetric,
      iterations: registration.GetOptimizerIteration(),
      convergence: registration.GetOptimizerStopConditionDescription().includes('Converged'),
    };
  }

  /**
   * Deformable registration (non-rigid)
   */
  registerDeformable(fixedImage: any, movingImage: any): any {
    console.log('[Analysis] Performing deformable registration...');

    // Use B-spline transform for deformable registration
    const transformDomainMeshSize = [8, 8, 8];
    const initialTransform = sitk.BSplineTransformInitializer(
      fixedImage,
      transformDomainMeshSize
    );

    const registration = new sitk.ImageRegistrationMethod();

    registration.SetMetricAsMattesMutualInformation(numberOfHistogramBins: 50);
    registration.SetOptimizerAsLBFGSB(
      gradientConvergenceTolerance: 1e-5,
      numberOfIterations: 100
    );

    registration.SetInitialTransform(initialTransform);
    registration.SetInterpolator(sitk.sitkLinear);

    const finalTransform = registration.Execute(fixedImage, movingImage);

    // Resample moving image
    const resampler = new sitk.ResampleImageFilter();
    resampler.SetReferenceImage(fixedImage);
    resampler.SetInterpolator(sitk.sitkLinear);
    resampler.SetDefaultPixelValue(0);
    resampler.SetTransform(finalTransform);

    return resampler.Execute(movingImage);
  }

  // ============================================================================
  // Geometric Transformations
  // ============================================================================

  /**
   * Resample image to new spacing
   */
  resample(image: any, newSpacing: number[], interpolation: string = 'linear'): any {
    console.log(`[Analysis] Resampling to spacing: ${newSpacing}...`);

    const originalSpacing = image.GetSpacing();
    const originalSize = image.GetSize();

    // Calculate new size
    const newSize = originalSize.map((s: number, i: number) =>
      Math.round((s * originalSpacing[i]) / newSpacing[i])
    );

    // Set up resampler
    const resampler = new sitk.ResampleImageFilter();
    resampler.SetOutputSpacing(newSpacing);
    resampler.SetSize(newSize);
    resampler.SetOutputDirection(image.GetDirection());
    resampler.SetOutputOrigin(image.GetOrigin());
    resampler.SetTransform(new sitk.Transform());
    resampler.SetDefaultPixelValue(0);

    if (interpolation === 'linear') {
      resampler.SetInterpolator(sitk.sitkLinear);
    } else if (interpolation === 'nearest') {
      resampler.SetInterpolator(sitk.sitkNearestNeighbor);
    }

    return resampler.Execute(image);
  }

  /**
   * Rotate image
   */
  rotate(image: any, angle: number, axis: [number, number, number] = [0, 0, 1]): any {
    console.log(`[Analysis] Rotating ${angle} degrees around axis ${axis}...`);

    const transform = new sitk.Euler3DTransform();
    transform.SetRotation(...axis.map(a => a * (angle * Math.PI / 180)));

    const resampler = new sitk.ResampleImageFilter();
    resampler.SetReferenceImage(image);
    resampler.SetInterpolator(sitk.sitkLinear);
    resampler.SetDefaultPixelValue(0);
    resampler.SetTransform(transform);

    return resampler.Execute(image);
  }

  /**
   * Flip image along axis
   */
  flip(image: any, flipAxes: boolean[]): any {
    console.log(`[Analysis] Flipping along axes: ${flipAxes}...`);

    const filter = new sitk.FlipImageFilter();
    filter.SetFlipAxes(flipAxes);

    return filter.Execute(image);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function loadImage(filepath: string): any {
  const analyzer = new ImageAnalyzer();
  return analyzer.loadImage(filepath);
}

export function getStatistics(image: any): ImageStatistics {
  const analyzer = new ImageAnalyzer();
  return analyzer.getStatistics(image);
}

export function gaussianSmooth(image: any, sigma: number = 1.0): any {
  const analyzer = new ImageAnalyzer();
  return analyzer.gaussianSmooth(image, sigma);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🔬 Image Analysis Demo\n');

  // Create synthetic test image using NumPy
  console.log('Creating synthetic test image...\n');

  const size = [256, 256];
  const testArray = numpy.random.randn(...size) * 100 + 500;

  const analyzer = new ImageAnalyzer();
  const testImage = analyzer.arrayToImage(testArray, spacing: [1.0, 1.0]);

  console.log('1. Image Statistics:');
  const stats = analyzer.getStatistics(testImage);
  console.log(`   Min: ${stats.min.toFixed(2)}`);
  console.log(`   Max: ${stats.max.toFixed(2)}`);
  console.log(`   Mean: ${stats.mean.toFixed(2)}`);
  console.log(`   Std: ${stats.std.toFixed(2)}`);
  console.log(`   P95: ${stats.percentile95.toFixed(2)}\n`);

  console.log('2. Applying Filters:');
  const smoothed = analyzer.gaussianSmooth(testImage, 2.0);
  console.log('   ✓ Gaussian smoothing');

  const median = analyzer.medianFilter(testImage, 1);
  console.log('   ✓ Median filter');

  const bilateral = analyzer.bilateralFilter(testImage);
  console.log('   ✓ Bilateral filter\n');

  console.log('3. Edge Detection:');
  const edges = analyzer.detectEdgesSobel(testImage);
  console.log('   ✓ Sobel edge detection\n');

  console.log('4. Enhancement:');
  const equalized = analyzer.equalizeHistogram(testImage);
  console.log('   ✓ Histogram equalization');

  const enhanced = analyzer.clahe(testImage);
  console.log('   ✓ CLAHE enhancement\n');

  console.log('5. Thresholding:');
  const thresholded = analyzer.thresholdOtsu(testImage);
  console.log('   ✓ Otsu thresholding\n');

  console.log('✅ Image analysis demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - SimpleITK filters in TypeScript');
  console.log('   - scikit-image algorithms in TypeScript');
  console.log('   - NumPy/SciPy for statistics');
  console.log('   - Zero-copy memory sharing');
  console.log('   - All in one process!');
}
