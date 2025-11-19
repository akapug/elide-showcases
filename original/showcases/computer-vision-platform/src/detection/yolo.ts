/**
 * YOLO Object Detection - PyTorch YOLO in TypeScript!
 *
 * Demonstrates:
 * - python:torch (PyTorch) for deep learning
 * - python:cv2 (OpenCV) for image processing
 * - python:torchvision for pre-trained models
 * - Zero-copy tensor operations
 *
 * This is ONLY possible with Elide's polyglot runtime!
 */

// @ts-ignore - PyTorch deep learning framework
import torch from 'python:torch';
// @ts-ignore - Torchvision models
import torchvision from 'python:torchvision';
// @ts-ignore - OpenCV
import cv2 from 'python:cv2';
// @ts-ignore - NumPy arrays
import numpy from 'python:numpy';

import type {
  YOLOConfig,
  YOLODetection,
  DetectionResult,
  BoundingBox,
  ImageData,
} from '../types.js';

// ============================================================================
// COCO Class Names
// ============================================================================

const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
  'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
  'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
  'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush'
];

// ============================================================================
// YOLO Detector Class
// ============================================================================

export class YOLODetector {
  private model: any;
  private device: any;
  private confidenceThreshold: number;
  private nmsThreshold: number;
  private inputSize: number;

  constructor(config: YOLOConfig) {
    console.log('[YOLO] Initializing detector...');

    this.confidenceThreshold = config.confidenceThreshold || 0.5;
    this.nmsThreshold = config.nmsThreshold || 0.4;
    this.inputSize = config.inputSize || 640;

    // Detect device (CUDA if available, otherwise CPU)
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    console.log(`  Device: ${this.device}`);

    // Load YOLOv5 model from PyTorch Hub - directly in TypeScript!
    console.log('  Loading YOLOv5 model...');

    if (config.modelPath && config.modelPath.startsWith('yolov5')) {
      // Load from torch hub
      this.model = torch.hub.load('ultralytics/yolov5', config.modelPath, { pretrained: true });
    } else {
      // Default to YOLOv5s (small, fast)
      this.model = torch.hub.load('ultralytics/yolov5', 'yolov5s', { pretrained: true });
    }

    this.model.to(this.device);
    this.model.eval();

    // Configure model
    this.model.conf = this.confidenceThreshold;
    this.model.iou = this.nmsThreshold;

    console.log('  ✓ YOLO model loaded and ready');
  }

  /**
   * Detect objects in an image
   *
   * This demonstrates PyTorch inference directly in TypeScript!
   */
  async detect(image: ImageData | string): Promise<YOLODetection> {
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

    const preprocessStart = performance.now();

    // Preprocess image - using OpenCV in TypeScript!
    const resized = cv2.resize(
      imgData,
      [this.inputSize, this.inputSize],
      { interpolation: cv2.INTER_LINEAR }
    );

    // Convert to tensor (H, W, C) -> (C, H, W)
    const tensor = torch.from_numpy(resized).float();
    const normalized = tensor.div(255.0);
    const permuted = normalized.permute([2, 0, 1]);
    const batched = permuted.unsqueeze(0).to(this.device);

    const preprocessTime = performance.now() - preprocessStart;
    const inferenceStart = performance.now();

    // Run inference - PyTorch in TypeScript!
    let results: any;
    torch.no_grad(() => {
      results = this.model(batched);
    });

    const inferenceTime = performance.now() - inferenceStart;
    const postprocessStart = performance.now();

    // Post-process results
    const detections = this.parseResults(results, originalShape);

    const postprocessTime = performance.now() - postprocessStart;
    const totalTime = performance.now() - startTime;

    console.log(`[YOLO] Detected ${detections.length} objects in ${totalTime.toFixed(1)}ms`);
    console.log(`  Preprocess: ${preprocessTime.toFixed(1)}ms`);
    console.log(`  Inference: ${inferenceTime.toFixed(1)}ms`);
    console.log(`  Postprocess: ${postprocessTime.toFixed(1)}ms`);

    return {
      detections,
      inferenceTime,
      preprocessTime,
      postprocessTime,
    };
  }

  /**
   * Detect objects in video frames
   */
  async detectBatch(images: ImageData[]): Promise<YOLODetection[]> {
    console.log(`[YOLO] Processing batch of ${images.length} images...`);

    const startTime = performance.now();
    const results: YOLODetection[] = [];

    // Process in batches for efficiency
    const batchSize = 8;

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, Math.min(i + batchSize, images.length));

      // Process batch in parallel using Promise.all
      const batchResults = await Promise.all(
        batch.map(img => this.detect(img))
      );

      results.push(...batchResults);

      const progress = Math.min(i + batchSize, images.length);
      console.log(`  Processed ${progress}/${images.length} frames`);
    }

    const totalTime = performance.now() - startTime;
    const avgTime = totalTime / images.length;

    console.log(`[YOLO] Batch complete: ${totalTime.toFixed(1)}ms total, ${avgTime.toFixed(1)}ms/frame`);

    return results;
  }

  /**
   * Parse YOLO results into DetectionResult format
   */
  private parseResults(
    results: any,
    originalShape: [number, number]
  ): DetectionResult[] {
    const detections: DetectionResult[] = [];

    // YOLOv5 returns results in pandas DataFrame format
    const pred = results.pandas().xyxy[0];

    // Iterate through detections
    for (let i = 0; i < pred.shape[0]; i++) {
      const row = pred.iloc[i];

      // Extract bounding box (scaled to original image size)
      const x1 = Number(row['xmin']);
      const y1 = Number(row['ymin']);
      const x2 = Number(row['xmax']);
      const y2 = Number(row['ymax']);

      const bbox: BoundingBox = {
        x: Math.round(x1),
        y: Math.round(y1),
        width: Math.round(x2 - x1),
        height: Math.round(y2 - y1),
      };

      // Extract class and confidence
      const classId = Number(row['class']);
      const className = String(row['name']);
      const confidence = Number(row['confidence']);

      detections.push({
        class: className,
        classId,
        confidence,
        bbox,
      });
    }

    return detections;
  }

  /**
   * Draw bounding boxes on image
   */
  drawDetections(
    image: ImageData | string,
    detections: DetectionResult[],
    outputPath?: string
  ): ImageData {
    console.log(`[YOLO] Drawing ${detections.length} detections...`);

    let img: any;

    if (typeof image === 'string') {
      img = cv2.imread(image);
    } else {
      img = image.data.copy();
    }

    // Draw each detection using OpenCV in TypeScript!
    for (const det of detections) {
      const { bbox, class: className, confidence } = det;

      // Generate color based on class
      const color = this.getClassColor(det.classId);

      // Draw rectangle
      cv2.rectangle(
        img,
        [bbox.x, bbox.y],
        [bbox.x + bbox.width, bbox.y + bbox.height],
        color,
        2
      );

      // Draw label background
      const label = `${className} ${(confidence * 100).toFixed(1)}%`;
      const [labelWidth, labelHeight] = cv2.getTextSize(
        label,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        2
      )[0];

      cv2.rectangle(
        img,
        [bbox.x, bbox.y - labelHeight - 10],
        [bbox.x + labelWidth, bbox.y],
        color,
        -1
      );

      // Draw label text
      cv2.putText(
        img,
        label,
        [bbox.x, bbox.y - 5],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        [255, 255, 255],
        2
      );
    }

    // Save if output path provided
    if (outputPath) {
      cv2.imwrite(outputPath, img);
      console.log(`  Saved to ${outputPath}`);
    }

    return {
      data: img,
      width: img.shape[1],
      height: img.shape[0],
      channels: img.shape[2],
      dtype: String(img.dtype),
    };
  }

  /**
   * Get color for class (consistent colors)
   */
  private getClassColor(classId: number): [number, number, number] {
    // Generate deterministic color from class ID
    const hue = (classId * 37) % 180;
    const color = cv2.cvtColor(
      numpy.uint8([[[hue, 255, 255]]]),
      cv2.COLOR_HSV2BGR
    )[0][0];

    return [Number(color[0]), Number(color[1]), Number(color[2])];
  }

  /**
   * Filter detections by class
   */
  filterByClass(detections: DetectionResult[], classes: string[]): DetectionResult[] {
    return detections.filter(det => classes.includes(det.class));
  }

  /**
   * Filter detections by confidence
   */
  filterByConfidence(detections: DetectionResult[], minConfidence: number): DetectionResult[] {
    return detections.filter(det => det.confidence >= minConfidence);
  }

  /**
   * Get detection statistics
   */
  getStatistics(detections: DetectionResult[]): {
    totalObjects: number;
    classCounts: Map<string, number>;
    avgConfidence: number;
    maxConfidence: number;
    minConfidence: number;
  } {
    const classCounts = new Map<string, number>();
    let totalConfidence = 0;
    let maxConf = 0;
    let minConf = 1;

    for (const det of detections) {
      // Count classes
      classCounts.set(det.class, (classCounts.get(det.class) || 0) + 1);

      // Track confidence stats
      totalConfidence += det.confidence;
      maxConf = Math.max(maxConf, det.confidence);
      minConf = Math.min(minConf, det.confidence);
    }

    return {
      totalObjects: detections.length,
      classCounts,
      avgConfidence: detections.length > 0 ? totalConfidence / detections.length : 0,
      maxConfidence: maxConf,
      minConfidence: minConf,
    };
  }

  /**
   * Change model dynamically
   */
  async loadModel(modelName: string): Promise<void> {
    console.log(`[YOLO] Loading model: ${modelName}...`);

    this.model = torch.hub.load('ultralytics/yolov5', modelName, { pretrained: true });
    this.model.to(this.device);
    this.model.eval();

    this.model.conf = this.confidenceThreshold;
    this.model.iou = this.nmsThreshold;

    console.log('  ✓ Model loaded');
  }

  /**
   * Update confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = threshold;
    this.model.conf = threshold;
    console.log(`[YOLO] Confidence threshold: ${threshold}`);
  }

  /**
   * Update NMS threshold
   */
  setNMSThreshold(threshold: number): void {
    this.nmsThreshold = threshold;
    this.model.iou = threshold;
    console.log(`[YOLO] NMS threshold: ${threshold}`);
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    device: string;
    confidenceThreshold: number;
    nmsThreshold: number;
    inputSize: number;
  } {
    return {
      device: String(this.device),
      confidenceThreshold: this.confidenceThreshold,
      nmsThreshold: this.nmsThreshold,
      inputSize: this.inputSize,
    };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick object detection on a single image
 */
export async function detectObjects(
  imagePath: string,
  options?: Partial<YOLOConfig>
): Promise<YOLODetection> {
  const detector = new YOLODetector({
    modelPath: 'yolov5s',
    ...options,
  });

  return detector.detect(imagePath);
}

/**
 * Detect and save annotated image
 */
export async function detectAndSave(
  inputPath: string,
  outputPath: string,
  options?: Partial<YOLOConfig>
): Promise<YOLODetection> {
  const detector = new YOLODetector({
    modelPath: 'yolov5s',
    ...options,
  });

  const result = await detector.detect(inputPath);
  detector.drawDetections(inputPath, result.detections, outputPath);

  return result;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎯 YOLO Object Detection Demo\n');

  // Create detector
  const detector = new YOLODetector({
    modelPath: 'yolov5s', // Small, fast model
    confidenceThreshold: 0.5,
    nmsThreshold: 0.4,
  });

  console.log('\n📊 Model Info:', detector.getModelInfo());

  // For demo, create a test image with OpenCV
  console.log('\n🖼️  Creating test image...');

  const testImg = numpy.zeros([480, 640, 3], { dtype: 'uint8' });

  // Draw some shapes
  cv2.rectangle(testImg, [100, 100], [200, 200], [0, 255, 0], -1);
  cv2.circle(testImg, [400, 300], 50, [255, 0, 0], -1);
  cv2.putText(
    testImg,
    'YOLO Test',
    [50, 50],
    cv2.FONT_HERSHEY_SIMPLEX,
    1.0,
    [255, 255, 255],
    2
  );

  cv2.imwrite('/tmp/yolo-test.jpg', testImg);
  console.log('✓ Test image saved');

  // Detect objects
  console.log('\n🔍 Running detection...');

  const result = await detector.detect('/tmp/yolo-test.jpg');

  console.log('\n📈 Results:');
  console.log(`  Detections: ${result.detections.length}`);

  for (const det of result.detections) {
    console.log(`  - ${det.class}: ${(det.confidence * 100).toFixed(1)}% at (${det.bbox.x}, ${det.bbox.y})`);
  }

  // Draw and save
  detector.drawDetections('/tmp/yolo-test.jpg', result.detections, '/tmp/yolo-output.jpg');

  console.log('\n✅ YOLO demo completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   - PyTorch models in TypeScript');
  console.log('   - OpenCV image processing in TypeScript');
  console.log('   - Zero-copy tensor operations');
  console.log('   - Real-time object detection');
  console.log('   - All in one process with Elide!');
}
