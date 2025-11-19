/**
 * Semantic Segmentation - DeepLabV3 in TypeScript!
 *
 * Demonstrates:
 * - python:torchvision semantic segmentation models
 * - python:torch for deep learning inference
 * - python:cv2 for image processing and visualization
 * - Pixel-wise classification with DeepLabV3
 *
 * This is ONLY possible with Elide's polyglot runtime!
 */

// @ts-ignore - PyTorch deep learning framework
import torch from 'python:torch';
// @ts-ignore - Torchvision models and transforms
import torchvision from 'python:torchvision';
// @ts-ignore - OpenCV for image processing
import cv2 from 'python:cv2';
// @ts-ignore - NumPy arrays
import numpy from 'python:numpy';

import type {
  ImageData,
  SegmentationMask,
  SemanticSegmentationResult,
  ModelConfig,
} from '../types.js';

// ============================================================================
// PASCAL VOC Classes
// ============================================================================

const PASCAL_VOC_CLASSES = [
  'background', 'aeroplane', 'bicycle', 'bird', 'boat', 'bottle', 'bus',
  'car', 'cat', 'chair', 'cow', 'diningtable', 'dog', 'horse', 'motorbike',
  'person', 'pottedplant', 'sheep', 'sofa', 'train', 'tvmonitor'
];

// ============================================================================
// Color Palette for Visualization
// ============================================================================

const PASCAL_VOC_COLORMAP = [
  [0, 0, 0],       // background - black
  [128, 0, 0],     // aeroplane - maroon
  [0, 128, 0],     // bicycle - green
  [128, 128, 0],   // bird - olive
  [0, 0, 128],     // boat - navy
  [128, 0, 128],   // bottle - purple
  [0, 128, 128],   // bus - teal
  [128, 128, 128], // car - gray
  [64, 0, 0],      // cat - dark red
  [192, 0, 0],     // chair - red
  [64, 128, 0],    // cow - yellow-green
  [192, 128, 0],   // diningtable - orange
  [64, 0, 128],    // dog - purple
  [192, 0, 128],   // horse - pink
  [64, 128, 128],  // motorbike - cyan
  [192, 128, 128], // person - light gray
  [0, 64, 0],      // pottedplant - dark green
  [128, 64, 0],    // sheep - brown
  [0, 192, 0],     // sofa - lime
  [128, 192, 0],   // train - yellow
  [0, 64, 128],    // tvmonitor - blue
];

// ============================================================================
// Semantic Segmenter Class
// ============================================================================

export class SemanticSegmenter {
  private model: any;
  private device: any;
  private inputSize: [number, number];
  private mean: number[];
  private std: number[];
  private classes: string[];
  private colormap: number[][];

  constructor(config?: Partial<ModelConfig>) {
    console.log('[SemanticSegmentation] Initializing segmenter...');

    // Configuration
    this.inputSize = config?.inputSize || [512, 512];
    this.mean = config?.mean || [0.485, 0.456, 0.406];
    this.std = config?.std || [0.229, 0.224, 0.225];
    this.classes = PASCAL_VOC_CLASSES;
    this.colormap = PASCAL_VOC_COLORMAP;

    // Detect device (CUDA if available, otherwise CPU)
    const deviceStr = config?.device || 'auto';
    if (deviceStr === 'auto') {
      this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    } else {
      this.device = torch.device(deviceStr);
    }
    console.log(`  Device: ${this.device}`);

    // Load DeepLabV3 model with ResNet-101 backbone - directly in TypeScript!
    console.log('  Loading DeepLabV3-ResNet101 model...');
    this.model = torchvision.models.segmentation.deeplabv3_resnet101({
      pretrained: true,
      progress: true,
    });

    this.model.to(this.device);
    this.model.eval();

    console.log('  ✓ Semantic segmentation model loaded and ready');
    console.log(`  Input size: ${this.inputSize[0]}x${this.inputSize[1]}`);
    console.log(`  Classes: ${this.classes.length}`);
  }

  /**
   * Segment an image into semantic classes
   *
   * This demonstrates PyTorch semantic segmentation in TypeScript!
   */
  async segment(image: ImageData | string): Promise<SemanticSegmentationResult> {
    const startTime = performance.now();

    let imgData: any;
    let originalShape: [number, number];

    // Load image if path provided
    if (typeof image === 'string') {
      imgData = cv2.imread(image);
      imgData = cv2.cvtColor(imgData, cv2.COLOR_BGR2RGB);
      originalShape = [imgData.shape[0], imgData.shape[1]];
    } else {
      imgData = image.data;
      originalShape = [image.height, image.width];
    }

    console.log(`[Segmentation] Processing image: ${originalShape[1]}x${originalShape[0]}`);

    // Preprocess image
    const inputTensor = this.preprocessImage(imgData);

    // Run inference
    let output: any;
    const inferenceStart = performance.now();

    torch.no_grad(() => {
      output = this.model(inputTensor);
    });

    const inferenceTime = performance.now() - inferenceStart;

    // Post-process output
    const mask = this.postprocessOutput(output, originalShape);

    // Create color visualization
    const colorMap = this.createColorMap(mask);

    const totalTime = performance.now() - startTime;

    console.log(`[Segmentation] Completed in ${totalTime.toFixed(1)}ms`);
    console.log(`  Inference: ${inferenceTime.toFixed(1)}ms`);

    // Get class statistics
    const stats = this.getClassStatistics(mask);
    console.log('  Classes detected:');
    for (const [className, count] of stats.entries()) {
      if (className !== 'background' && count > 0) {
        console.log(`    - ${className}: ${count} pixels`);
      }
    }

    return {
      mask: {
        mask: mask,
        classes: this.classes,
        numClasses: this.classes.length,
      },
      colorMap: colorMap,
      inferenceTime: totalTime,
    };
  }

  /**
   * Preprocess image for model input
   */
  private preprocessImage(image: any): any {
    // Resize to input size
    const resized = cv2.resize(
      image,
      this.inputSize,
      { interpolation: cv2.INTER_LINEAR }
    );

    // Convert to float and normalize to [0, 1]
    const normalized = resized.astype('float32').div(255.0);

    // Apply ImageNet normalization
    const mean = numpy.array(this.mean).reshape([1, 1, 3]);
    const std = numpy.array(this.std).reshape([1, 1, 3]);
    const standardized = normalized.sub(mean).div(std);

    // Convert to tensor (H, W, C) -> (C, H, W)
    const tensor = torch.from_numpy(standardized).float();
    const permuted = tensor.permute([2, 0, 1]);
    const batched = permuted.unsqueeze(0).to(this.device);

    return batched;
  }

  /**
   * Post-process model output to get segmentation mask
   */
  private postprocessOutput(output: any, originalShape: [number, number]): any {
    // DeepLabV3 returns a dictionary with 'out' key
    const segmentationMap = output['out'];

    // Get class predictions (argmax along class dimension)
    const predictions = torch.argmax(segmentationMap, 1);

    // Move to CPU and convert to NumPy
    const predictionsCpu = predictions.cpu().squeeze(0);
    const mask = predictionsCpu.numpy().astype('uint8');

    // Resize to original shape
    const resized = cv2.resize(
      mask,
      [originalShape[1], originalShape[0]],
      { interpolation: cv2.INTER_NEAREST }
    );

    return resized;
  }

  /**
   * Create color map for visualization
   */
  private createColorMap(mask: any): any {
    const height = mask.shape[0];
    const width = mask.shape[1];

    // Create RGB image
    const colorMap = numpy.zeros([height, width, 3], { dtype: 'uint8' });

    // Map each class to its color
    for (let i = 0; i < this.classes.length; i++) {
      const color = this.colormap[i];
      const classMask = mask.eq(i);

      colorMap[classMask] = color;
    }

    return colorMap;
  }

  /**
   * Visualize segmentation with color overlay
   */
  visualize(
    image: ImageData | string,
    result: SemanticSegmentationResult,
    alpha: number = 0.6,
    outputPath?: string
  ): ImageData {
    console.log('[Segmentation] Creating visualization...');

    let imgData: any;

    // Load image if path provided
    if (typeof image === 'string') {
      imgData = cv2.imread(image);
      imgData = cv2.cvtColor(imgData, cv2.COLOR_BGR2RGB);
    } else {
      imgData = image.data.copy();
    }

    // Blend original image with color map
    const colorMapBgr = cv2.cvtColor(result.colorMap, cv2.COLOR_RGB2BGR);
    const blended = cv2.addWeighted(imgData, 1 - alpha, colorMapBgr, alpha, 0);

    // Add legend
    const withLegend = this.addLegend(blended, result.mask);

    // Save if output path provided
    if (outputPath) {
      cv2.imwrite(outputPath, withLegend);
      console.log(`  Saved visualization to ${outputPath}`);
    }

    return {
      data: withLegend,
      width: withLegend.shape[1],
      height: withLegend.shape[0],
      channels: withLegend.shape[2],
      dtype: String(withLegend.dtype),
    };
  }

  /**
   * Add legend to visualization
   */
  private addLegend(image: any, mask: SegmentationMask): any {
    const img = image.copy();
    const height = img.shape[0];
    const width = img.shape[1];

    // Detect which classes are present
    const presentClasses: number[] = [];
    for (let i = 0; i < this.classes.length; i++) {
      const classPresent = numpy.any(mask.mask.eq(i));
      if (classPresent && i !== 0) { // Skip background
        presentClasses.push(i);
      }
    }

    if (presentClasses.length === 0) {
      return img;
    }

    // Draw legend background
    const legendHeight = Math.min(30 + presentClasses.length * 25, 200);
    const legendWidth = 200;
    const legendX = width - legendWidth - 10;
    const legendY = 10;

    cv2.rectangle(
      img,
      [legendX, legendY],
      [legendX + legendWidth, legendY + legendHeight],
      [0, 0, 0],
      -1
    );

    cv2.rectangle(
      img,
      [legendX, legendY],
      [legendX + legendWidth, legendY + legendHeight],
      [255, 255, 255],
      2
    );

    // Draw legend title
    cv2.putText(
      img,
      'Classes',
      [legendX + 10, legendY + 20],
      cv2.FONT_HERSHEY_SIMPLEX,
      0.5,
      [255, 255, 255],
      1
    );

    // Draw each class
    for (let i = 0; i < Math.min(presentClasses.length, 6); i++) {
      const classId = presentClasses[i];
      const className = this.classes[classId];
      const color = this.colormap[classId];
      const y = legendY + 40 + i * 25;

      // Draw color box
      cv2.rectangle(
        img,
        [legendX + 10, y - 12],
        [legendX + 30, y + 2],
        color,
        -1
      );

      // Draw class name
      cv2.putText(
        img,
        className,
        [legendX + 35, y],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.4,
        [255, 255, 255],
        1
      );
    }

    return img;
  }

  /**
   * Get statistics about detected classes
   */
  private getClassStatistics(mask: any): Map<string, number> {
    const stats = new Map<string, number>();

    for (let i = 0; i < this.classes.length; i++) {
      const count = Number(numpy.sum(mask.eq(i)));
      stats.set(this.classes[i], count);
    }

    return stats;
  }

  /**
   * Extract specific class mask
   */
  extractClassMask(result: SemanticSegmentationResult, className: string): any {
    const classId = this.classes.indexOf(className);

    if (classId === -1) {
      throw new Error(`Class "${className}" not found`);
    }

    const mask = result.mask.mask.eq(classId).astype('uint8').mul(255);

    return mask;
  }

  /**
   * Get binary mask for multiple classes
   */
  getMultiClassMask(result: SemanticSegmentationResult, classNames: string[]): any {
    const masks: any[] = [];

    for (const className of classNames) {
      const classId = this.classes.indexOf(className);
      if (classId !== -1) {
        const mask = result.mask.mask.eq(classId);
        masks.push(mask);
      }
    }

    if (masks.length === 0) {
      return numpy.zeros_like(result.mask.mask);
    }

    // Combine masks using logical OR
    let combined = masks[0];
    for (let i = 1; i < masks.length; i++) {
      combined = numpy.logical_or(combined, masks[i]);
    }

    return combined.astype('uint8').mul(255);
  }

  /**
   * Apply mask to image (extract foreground)
   */
  applyMask(image: ImageData | string, mask: any): ImageData {
    let imgData: any;

    if (typeof image === 'string') {
      imgData = cv2.imread(image);
      imgData = cv2.cvtColor(imgData, cv2.COLOR_BGR2RGB);
    } else {
      imgData = image.data.copy();
    }

    // Ensure mask is binary
    const binaryMask = mask.gt(0).astype('uint8');

    // Apply mask to each channel
    const masked = cv2.bitwise_and(imgData, imgData, { mask: binaryMask });

    return {
      data: masked,
      width: masked.shape[1],
      height: masked.shape[0],
      channels: masked.shape[2],
      dtype: String(masked.dtype),
    };
  }

  /**
   * Segment batch of images
   */
  async segmentBatch(images: ImageData[]): Promise<SemanticSegmentationResult[]> {
    console.log(`[Segmentation] Processing batch of ${images.length} images...`);

    const results: SemanticSegmentationResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const result = await this.segment(images[i]);
      results.push(result);

      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${images.length} images`);
      }
    }

    console.log(`[Segmentation] Batch complete`);

    return results;
  }

  /**
   * Get segmentation confidence scores
   */
  getConfidenceScores(image: ImageData | string): any {
    let imgData: any;

    if (typeof image === 'string') {
      imgData = cv2.imread(image);
      imgData = cv2.cvtColor(imgData, cv2.COLOR_BGR2RGB);
    } else {
      imgData = image.data;
    }

    const inputTensor = this.preprocessImage(imgData);

    let output: any;
    torch.no_grad(() => {
      output = this.model(inputTensor);
    });

    // Get raw scores
    const scores = output['out'];

    // Apply softmax to get probabilities
    const probs = torch.nn.functional.softmax(scores, 1);

    // Move to CPU and convert to NumPy
    const probsCpu = probs.cpu().squeeze(0);
    const probsNp = probsCpu.numpy();

    return probsNp;
  }

  /**
   * Compare two segmentation results
   */
  compareSegmentations(
    mask1: SegmentationMask,
    mask2: SegmentationMask
  ): {
    agreement: number;
    iou: number;
    classAgreement: Map<string, number>;
  } {
    const m1 = mask1.mask;
    const m2 = mask2.mask;

    // Overall pixel agreement
    const agreement = Number(numpy.mean(m1.eq(m2)));

    // Intersection over Union
    const intersection = Number(numpy.sum(numpy.logical_and(m1.gt(0), m2.gt(0))));
    const union = Number(numpy.sum(numpy.logical_or(m1.gt(0), m2.gt(0))));
    const iou = union > 0 ? intersection / union : 0;

    // Per-class agreement
    const classAgreement = new Map<string, number>();

    for (let i = 0; i < this.classes.length; i++) {
      const mask1Class = m1.eq(i);
      const mask2Class = m2.eq(i);

      const classIntersection = Number(numpy.sum(numpy.logical_and(mask1Class, mask2Class)));
      const classUnion = Number(numpy.sum(numpy.logical_or(mask1Class, mask2Class)));

      const classIou = classUnion > 0 ? classIntersection / classUnion : 0;
      classAgreement.set(this.classes[i], classIou);
    }

    return {
      agreement,
      iou,
      classAgreement,
    };
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    device: string;
    inputSize: [number, number];
    numClasses: number;
    classes: string[];
  } {
    return {
      device: String(this.device),
      inputSize: this.inputSize,
      numClasses: this.classes.length,
      classes: this.classes,
    };
  }

  /**
   * Update input size
   */
  setInputSize(width: number, height: number): void {
    this.inputSize = [height, width];
    console.log(`[Segmentation] Input size updated to ${width}x${height}`);
  }

  /**
   * Get color for class
   */
  getClassColor(className: string): number[] | null {
    const classId = this.classes.indexOf(className);

    if (classId === -1) {
      return null;
    }

    return this.colormap[classId];
  }

  /**
   * Create custom color map
   */
  setCustomColormap(colormap: number[][]): void {
    if (colormap.length !== this.classes.length) {
      throw new Error(`Colormap must have ${this.classes.length} colors`);
    }

    this.colormap = colormap;
    console.log('[Segmentation] Custom colormap applied');
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick semantic segmentation on a single image
 */
export async function segmentImage(
  imagePath: string,
  outputPath?: string
): Promise<SemanticSegmentationResult> {
  const segmenter = new SemanticSegmenter();
  const result = await segmenter.segment(imagePath);

  if (outputPath) {
    segmenter.visualize(imagePath, result, 0.6, outputPath);
  }

  return result;
}

/**
 * Segment and extract specific classes
 */
export async function extractClasses(
  imagePath: string,
  classNames: string[],
  outputPath?: string
): Promise<{ result: SemanticSegmentationResult; mask: any }> {
  const segmenter = new SemanticSegmenter();
  const result = await segmenter.segment(imagePath);
  const mask = segmenter.getMultiClassMask(result, classNames);

  if (outputPath) {
    const masked = segmenter.applyMask(imagePath, mask);
    cv2.imwrite(outputPath, masked.data);
  }

  return { result, mask };
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎨 Semantic Segmentation Demo\n');

  // Create segmenter
  const segmenter = new SemanticSegmenter({
    inputSize: [512, 512],
    device: 'auto',
  });

  console.log('\n📊 Model Info:', segmenter.getModelInfo());

  // Create a test image
  console.log('\n🖼️  Creating test image...');

  const testImg = numpy.zeros([480, 640, 3], { dtype: 'uint8' });

  // Add some colored regions
  cv2.rectangle(testImg, [50, 50], [250, 250], [100, 150, 200], -1);
  cv2.rectangle(testImg, [300, 100], [500, 300], [200, 100, 50], -1);
  cv2.circle(testImg, [400, 400], 60, [50, 200, 100], -1);

  cv2.putText(
    testImg,
    'Semantic Segmentation',
    [50, 400],
    cv2.FONT_HERSHEY_SIMPLEX,
    0.8,
    [255, 255, 255],
    2
  );

  cv2.imwrite('/tmp/seg-test.jpg', testImg);
  console.log('✓ Test image saved');

  // Perform segmentation
  console.log('\n🔍 Running segmentation...');

  const result = await segmenter.segment('/tmp/seg-test.jpg');

  console.log('\n📈 Segmentation Results:');
  console.log(`  Inference time: ${result.inferenceTime.toFixed(1)}ms`);
  console.log(`  Classes: ${result.mask.numClasses}`);

  // Create visualization
  const viz = segmenter.visualize(
    '/tmp/seg-test.jpg',
    result,
    0.6,
    '/tmp/seg-output.jpg'
  );

  console.log('\n✅ Semantic segmentation demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - DeepLabV3 semantic segmentation in TypeScript');
  console.log('   - PyTorch torchvision models');
  console.log('   - Pixel-wise classification');
  console.log('   - Color overlay visualization');
  console.log('   - All in one process with Elide!');
}
