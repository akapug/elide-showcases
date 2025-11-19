/**
 * Instance Segmentation - Mask R-CNN in TypeScript!
 *
 * Demonstrates:
 * - python:torchvision.models.detection for Mask R-CNN
 * - python:torch for deep learning inference
 * - python:cv2 for image processing
 * - Instance-level object segmentation
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
  InstanceSegmentation,
  BoundingBox,
  ModelConfig,
} from '../types.js';

// ============================================================================
// COCO Instance Classes
// ============================================================================

const COCO_INSTANCE_CLASSES = [
  '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
  'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
  'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
  'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
  'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
  'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
  'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
  'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

// ============================================================================
// Instance Segmenter Class
// ============================================================================

export class InstanceSegmenter {
  private model: any;
  private device: any;
  private confidenceThreshold: number;
  private maskThreshold: number;
  private classes: string[];

  constructor(config?: Partial<ModelConfig & { confidenceThreshold?: number; maskThreshold?: number }>) {
    console.log('[InstanceSegmentation] Initializing segmenter...');

    // Configuration
    this.confidenceThreshold = config?.confidenceThreshold || 0.5;
    this.maskThreshold = config?.maskThreshold || 0.5;
    this.classes = COCO_INSTANCE_CLASSES;

    // Detect device
    const deviceStr = config?.device || 'auto';
    if (deviceStr === 'auto') {
      this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    } else {
      this.device = torch.device(deviceStr);
    }
    console.log(`  Device: ${this.device}`);

    // Load Mask R-CNN model with ResNet-50 backbone - directly in TypeScript!
    console.log('  Loading Mask R-CNN ResNet-50 model...');
    this.model = torchvision.models.detection.maskrcnn_resnet50_fpn({
      pretrained: true,
      progress: true,
    });

    this.model.to(this.device);
    this.model.eval();

    console.log('  ✓ Mask R-CNN model loaded and ready');
    console.log(`  Confidence threshold: ${this.confidenceThreshold}`);
    console.log(`  Mask threshold: ${this.maskThreshold}`);
  }

  /**
   * Segment instances in an image
   *
   * This demonstrates Mask R-CNN inference in TypeScript!
   */
  async segment(image: ImageData | string): Promise<InstanceSegmentation> {
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

    console.log(`[InstanceSegmentation] Processing image: ${originalShape[1]}x${originalShape[0]}`);

    // Preprocess image
    const inputTensor = this.preprocessImage(imgData);

    // Run inference
    let predictions: any;
    const inferenceStart = performance.now();

    torch.no_grad(() => {
      predictions = this.model(inputTensor);
    });

    const inferenceTime = performance.now() - inferenceStart;

    // Post-process predictions
    const instances = this.postprocessPredictions(predictions, originalShape);

    const totalTime = performance.now() - startTime;

    console.log(`[InstanceSegmentation] Completed in ${totalTime.toFixed(1)}ms`);
    console.log(`  Inference: ${inferenceTime.toFixed(1)}ms`);
    console.log(`  Instances detected: ${instances.masks.length}`);

    return instances;
  }

  /**
   * Preprocess image for Mask R-CNN
   */
  private preprocessImage(image: any): any {
    // Convert to float and normalize to [0, 1]
    const normalized = image.astype('float32').div(255.0);

    // Convert to tensor (H, W, C) -> (C, H, W)
    const tensor = torch.from_numpy(normalized).float();
    const permuted = tensor.permute([2, 0, 1]);
    const batched = permuted.unsqueeze(0).to(this.device);

    return batched;
  }

  /**
   * Post-process Mask R-CNN predictions
   */
  private postprocessPredictions(
    predictions: any,
    originalShape: [number, number]
  ): InstanceSegmentation {
    // Get predictions for first (and only) image in batch
    const pred = predictions[0];

    // Extract boxes, labels, scores, and masks
    const boxes = pred['boxes'].cpu().numpy();
    const labels = pred['labels'].cpu().numpy();
    const scores = pred['scores'].cpu().numpy();
    const masks = pred['masks'].cpu().numpy();

    // Filter by confidence threshold
    const validIndices: number[] = [];
    for (let i = 0; i < scores.shape[0]; i++) {
      if (Number(scores[i]) >= this.confidenceThreshold) {
        validIndices.push(i);
      }
    }

    const filteredMasks: any[] = [];
    const filteredClasses: string[] = [];
    const filteredScores: number[] = [];
    const filteredBboxes: BoundingBox[] = [];

    for (const idx of validIndices) {
      // Get mask (1, H, W) and threshold
      const mask = masks[idx][0];
      const binaryMask = mask.gt(this.maskThreshold).astype('uint8');

      filteredMasks.push(binaryMask);

      // Get class
      const labelId = Number(labels[idx]);
      const className = this.classes[labelId] || `class_${labelId}`;
      filteredClasses.push(className);

      // Get score
      filteredScores.push(Number(scores[idx]));

      // Get bounding box
      const box = boxes[idx];
      filteredBboxes.push({
        x: Math.round(Number(box[0])),
        y: Math.round(Number(box[1])),
        width: Math.round(Number(box[2]) - Number(box[0])),
        height: Math.round(Number(box[3]) - Number(box[1])),
      });
    }

    return {
      masks: filteredMasks,
      classes: filteredClasses,
      scores: filteredScores,
      bboxes: filteredBboxes,
    };
  }

  /**
   * Visualize instance segmentation results
   */
  visualize(
    image: ImageData | string,
    instances: InstanceSegmentation,
    outputPath?: string
  ): ImageData {
    console.log('[InstanceSegmentation] Creating visualization...');

    let imgData: any;

    // Load image if path provided
    if (typeof image === 'string') {
      imgData = cv2.imread(image);
      imgData = cv2.cvtColor(imgData, cv2.COLOR_BGR2RGB);
    } else {
      imgData = image.data.copy();
    }

    // Create overlay for masks
    const overlay = imgData.copy();

    // Draw each instance
    for (let i = 0; i < instances.masks.length; i++) {
      const mask = instances.masks[i];
      const className = instances.classes[i];
      const score = instances.scores[i];
      const bbox = instances.bboxes[i];

      // Generate unique color for this instance
      const color = this.getInstanceColor(i);

      // Apply colored mask
      overlay[mask.gt(0)] = color;

      // Draw bounding box
      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y + bbox.height],
        color,
        2
      );

      // Draw label
      const label = `${className} ${(score * 100).toFixed(1)}%`;
      const [labelWidth, labelHeight] = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        2
      )[0];

      cv2.rectangle(
        imgData,
        [bbox.x, bbox.y - labelHeight - 10],
        [bbox.x + labelWidth, bbox.y],
        color,
        -1
      );

      cv2.putText(
        imgData,
        label,
        [bbox.x, bbox.y - 5],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        [255, 255, 255],
        2
      );
    }

    // Blend original image with mask overlay
    const blended = cv2.addWeighted(imgData, 0.6, overlay, 0.4, 0);

    // Save if output path provided
    if (outputPath) {
      cv2.imwrite(outputPath, blended);
      console.log(`  Saved visualization to ${outputPath}`);
    }

    return {
      data: blended,
      width: blended.shape[1],
      height: blended.shape[0],
      channels: blended.shape[2],
      dtype: String(blended.dtype),
    };
  }

  /**
   * Get unique color for instance
   */
  private getInstanceColor(instanceId: number): [number, number, number] {
    // Generate deterministic color from instance ID
    const hue = (instanceId * 47) % 180;
    const color = cv2.cvtColor(
      numpy.uint8([[[hue, 200, 200]]]),
      cv2.COLOR_HSV2BGR
    )[0][0];

    return [Number(color[0]), Number(color[1]), Number(color[2])];
  }

  /**
   * Get instance masks as separate images
   */
  extractInstanceMasks(instances: InstanceSegmentation): ImageData[] {
    const maskImages: ImageData[] = [];

    for (const mask of instances.masks) {
      const maskImg = mask.mul(255).astype('uint8');

      maskImages.push({
        data: maskImg,
        width: maskImg.shape[1],
        height: maskImg.shape[0],
        channels: 1,
        dtype: String(maskImg.dtype),
      });
    }

    return maskImages;
  }

  /**
   * Filter instances by class
   */
  filterByClass(instances: InstanceSegmentation, classNames: string[]): InstanceSegmentation {
    const filteredMasks: any[] = [];
    const filteredClasses: string[] = [];
    const filteredScores: number[] = [];
    const filteredBboxes: BoundingBox[] = [];

    for (let i = 0; i < instances.classes.length; i++) {
      if (classNames.includes(instances.classes[i])) {
        filteredMasks.push(instances.masks[i]);
        filteredClasses.push(instances.classes[i]);
        filteredScores.push(instances.scores[i]);
        filteredBboxes.push(instances.bboxes[i]);
      }
    }

    return {
      masks: filteredMasks,
      classes: filteredClasses,
      scores: filteredScores,
      bboxes: filteredBboxes,
    };
  }

  /**
   * Filter instances by minimum area
   */
  filterByArea(instances: InstanceSegmentation, minArea: number): InstanceSegmentation {
    const filteredMasks: any[] = [];
    const filteredClasses: string[] = [];
    const filteredScores: number[] = [];
    const filteredBboxes: BoundingBox[] = [];

    for (let i = 0; i < instances.masks.length; i++) {
      const area = Number(numpy.sum(instances.masks[i]));

      if (area >= minArea) {
        filteredMasks.push(instances.masks[i]);
        filteredClasses.push(instances.classes[i]);
        filteredScores.push(instances.scores[i]);
        filteredBboxes.push(instances.bboxes[i]);
      }
    }

    return {
      masks: filteredMasks,
      classes: filteredClasses,
      scores: filteredScores,
      bboxes: filteredBboxes,
    };
  }

  /**
   * Get instance statistics
   */
  getStatistics(instances: InstanceSegmentation): {
    totalInstances: number;
    classCounts: Map<string, number>;
    avgConfidence: number;
    avgArea: number;
    instanceAreas: number[];
  } {
    const classCounts = new Map<string, number>();
    let totalConfidence = 0;
    const instanceAreas: number[] = [];

    for (let i = 0; i < instances.classes.length; i++) {
      // Count classes
      const className = instances.classes[i];
      classCounts.set(className, (classCounts.get(className) || 0) + 1);

      // Track confidence
      totalConfidence += instances.scores[i];

      // Calculate area
      const area = Number(numpy.sum(instances.masks[i]));
      instanceAreas.push(area);
    }

    const avgArea = instanceAreas.length > 0
      ? instanceAreas.reduce((a, b) => a + b, 0) / instanceAreas.length
      : 0;

    return {
      totalInstances: instances.classes.length,
      classCounts,
      avgConfidence: instances.classes.length > 0 ? totalConfidence / instances.classes.length : 0,
      avgArea,
      instanceAreas,
    };
  }

  /**
   * Combine multiple instance masks
   */
  combineInstances(instances: InstanceSegmentation, indices: number[]): any {
    if (indices.length === 0) {
      return null;
    }

    let combined = instances.masks[indices[0]].copy();

    for (let i = 1; i < indices.length; i++) {
      const idx = indices[i];
      combined = numpy.logical_or(combined, instances.masks[idx]);
    }

    return combined.astype('uint8');
  }

  /**
   * Get instance contours
   */
  getInstanceContours(instances: InstanceSegmentation): any[][] {
    const allContours: any[][] = [];

    for (const mask of instances.masks) {
      const contours = cv2.findContours(
        mask.mul(255).astype('uint8'),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
      )[0];

      allContours.push(contours);
    }

    return allContours;
  }

  /**
   * Calculate IoU between two instances
   */
  calculateIoU(mask1: any, mask2: any): number {
    const intersection = Number(numpy.sum(numpy.logical_and(mask1, mask2)));
    const union = Number(numpy.sum(numpy.logical_or(mask1, mask2)));

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Find overlapping instances
   */
  findOverlaps(
    instances: InstanceSegmentation,
    iouThreshold: number = 0.1
  ): Map<number, number[]> {
    const overlaps = new Map<number, number[]>();

    for (let i = 0; i < instances.masks.length; i++) {
      const overlapList: number[] = [];

      for (let j = 0; j < instances.masks.length; j++) {
        if (i !== j) {
          const iou = this.calculateIoU(instances.masks[i], instances.masks[j]);

          if (iou >= iouThreshold) {
            overlapList.push(j);
          }
        }
      }

      if (overlapList.length > 0) {
        overlaps.set(i, overlapList);
      }
    }

    return overlaps;
  }

  /**
   * Segment batch of images
   */
  async segmentBatch(images: ImageData[]): Promise<InstanceSegmentation[]> {
    console.log(`[InstanceSegmentation] Processing batch of ${images.length} images...`);

    const results: InstanceSegmentation[] = [];

    for (let i = 0; i < images.length; i++) {
      const result = await this.segment(images[i]);
      results.push(result);

      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${images.length} images`);
      }
    }

    console.log(`[InstanceSegmentation] Batch complete`);

    return results;
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    device: string;
    confidenceThreshold: number;
    maskThreshold: number;
    numClasses: number;
  } {
    return {
      device: String(this.device),
      confidenceThreshold: this.confidenceThreshold,
      maskThreshold: this.maskThreshold,
      numClasses: this.classes.length,
    };
  }

  /**
   * Update confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = threshold;
    console.log(`[InstanceSegmentation] Confidence threshold: ${threshold}`);
  }

  /**
   * Update mask threshold
   */
  setMaskThreshold(threshold: number): void {
    this.maskThreshold = threshold;
    console.log(`[InstanceSegmentation] Mask threshold: ${threshold}`);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick instance segmentation on a single image
 */
export async function segmentInstances(
  imagePath: string,
  outputPath?: string,
  confidenceThreshold: number = 0.5
): Promise<InstanceSegmentation> {
  const segmenter = new InstanceSegmenter({ confidenceThreshold });
  const result = await segmenter.segment(imagePath);

  if (outputPath) {
    segmenter.visualize(imagePath, result, outputPath);
  }

  return result;
}

/**
 * Segment and filter by class
 */
export async function segmentAndFilter(
  imagePath: string,
  classNames: string[],
  outputPath?: string
): Promise<InstanceSegmentation> {
  const segmenter = new InstanceSegmenter();
  const result = await segmenter.segment(imagePath);
  const filtered = segmenter.filterByClass(result, classNames);

  if (outputPath) {
    segmenter.visualize(imagePath, filtered, outputPath);
  }

  return filtered;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎭 Instance Segmentation Demo\n');

  // Create segmenter
  const segmenter = new InstanceSegmenter({
    confidenceThreshold: 0.5,
    maskThreshold: 0.5,
    device: 'auto',
  });

  console.log('\n📊 Model Info:', segmenter.getModelInfo());

  // Create a test image with multiple objects
  console.log('\n🖼️  Creating test image...');

  const testImg = numpy.zeros([480, 640, 3], { dtype: 'uint8' });

  // Draw multiple objects
  cv2.rectangle(testImg, [50, 50], [150, 150], [255, 100, 100], -1);
  cv2.rectangle(testImg, [200, 100], [300, 200], [100, 255, 100], -1);
  cv2.circle(testImg, [450, 300], 60, [100, 100, 255], -1);
  cv2.circle(testImg, [200, 350], 40, [255, 255, 100], -1);

  cv2.putText(
    testImg,
    'Instance Segmentation',
    [50, 450],
    cv2.FONT_HERSHEY_SIMPLEX,
    0.8,
    [255, 255, 255],
    2
  );

  cv2.imwrite('/tmp/instance-test.jpg', testImg);
  console.log('✓ Test image saved');

  // Perform instance segmentation
  console.log('\n🔍 Running instance segmentation...');

  const result = await segmenter.segment('/tmp/instance-test.jpg');

  console.log('\n📈 Segmentation Results:');
  console.log(`  Instances detected: ${result.masks.length}`);

  // Get statistics
  const stats = segmenter.getStatistics(result);
  console.log(`  Average confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`);
  console.log('  Classes detected:');
  for (const [className, count] of stats.classCounts.entries()) {
    console.log(`    - ${className}: ${count}`);
  }

  // Create visualization
  segmenter.visualize('/tmp/instance-test.jpg', result, '/tmp/instance-output.jpg');

  console.log('\n✅ Instance segmentation demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - Mask R-CNN instance segmentation in TypeScript');
  console.log('   - PyTorch detection models');
  console.log('   - Per-instance mask prediction');
  console.log('   - Instance-level object detection');
  console.log('   - All in one process with Elide!');
}
