/**
 * Object Detection Module
 *
 * Multi-class object detection using YOLOv8, Faster R-CNN, and SSD
 * Supports real-time detection with GPU acceleration
 * Includes 3D bounding box estimation and distance calculation
 */

// @ts-ignore
import cv2 from 'python:cv2'
// @ts-ignore
import torch from 'python:torch'
// @ts-ignore
import numpy from 'python:numpy'

import type {
  DetectedObject,
  ObjectClass,
  BoundingBox2D,
  BoundingBox3D,
  Vector3D,
  ImageData,
  DetectorConfig,
  CameraModel
} from '../types'

export interface DetectionResult {
  objects: DetectedObject[]
  inferenceTime: number
  preprocessTime: number
  postprocessTime: number
}

export interface TrackingState {
  id: number
  object: DetectedObject
  age: number
  consecutiveDetections: number
  consecutiveMisses: number
  kalmanFilter: any
  history: DetectedObject[]
}

export class ObjectDetector {
  private config: DetectorConfig
  private model: any
  private device: any
  private nextObjectId: number = 0
  private trackingStates: Map<number, TrackingState> = new Map()

  // Class names for COCO dataset
  private static readonly COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
    'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench'
  ]

  // Class mapping to our ObjectClass enum
  private static readonly CLASS_MAPPING: Record<string, ObjectClass> = {
    'person': ObjectClass.PEDESTRIAN,
    'bicycle': ObjectClass.BICYCLE,
    'car': ObjectClass.CAR,
    'motorcycle': ObjectClass.MOTORCYCLE,
    'bus': ObjectClass.BUS,
    'truck': ObjectClass.TRUCK,
    'traffic light': ObjectClass.TRAFFIC_LIGHT,
    'stop sign': ObjectClass.TRAFFIC_SIGN
  }

  constructor(config: DetectorConfig) {
    this.config = {
      confidenceThreshold: 0.5,
      nmsThreshold: 0.45,
      maxDetections: 100,
      ...config
    }
  }

  /**
   * Initialize the detection model
   */
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.config.model} detector on ${this.config.device}...`)

    const startTime = Date.now()

    // Set device
    if (this.config.device === 'cuda') {
      if (!torch.cuda.is_available()) {
        console.warn('CUDA not available, falling back to CPU')
        this.device = torch.device('cpu')
      } else {
        this.device = torch.device('cuda')
      }
    } else {
      this.device = torch.device(this.config.device)
    }

    // Load model based on configuration
    if (this.config.model.startsWith('yolov8')) {
      await this.loadYOLOv8()
    } else if (this.config.model === 'fasterrcnn') {
      await this.loadFasterRCNN()
    } else if (this.config.model === 'ssd') {
      await this.loadSSD()
    } else {
      throw new Error(`Unknown model: ${this.config.model}`)
    }

    console.log(`Model initialized in ${Date.now() - startTime}ms`)
  }

  /**
   * Load YOLOv8 model
   */
  private async loadYOLOv8(): Promise<void> {
    // In a real implementation, this would load YOLOv8 from ultralytics
    // For this showcase, we'll simulate the model structure
    const modelPath = `models/${this.config.model}.pt`

    try {
      this.model = await torch.hub.load('ultralytics/yolov8', this.config.model, { pretrained: true })
      this.model.to(this.device)
      this.model.eval()

      // Set confidence threshold
      this.model.conf = this.config.confidenceThreshold
      this.model.iou = this.config.nmsThreshold
      this.model.max_det = this.config.maxDetections

      console.log(`YOLOv8 model loaded: ${this.config.model}`)
    } catch (error) {
      console.error('Failed to load YOLOv8 model:', error)
      throw error
    }
  }

  /**
   * Load Faster R-CNN model
   */
  private async loadFasterRCNN(): Promise<void> {
    const torchvision = await import('python:torchvision')

    this.model = torchvision.models.detection.fasterrcnn_resnet50_fpn({ pretrained: true })
    this.model.to(this.device)
    this.model.eval()

    console.log('Faster R-CNN model loaded')
  }

  /**
   * Load SSD model
   */
  private async loadSSD(): Promise<void> {
    const torchvision = await import('python:torchvision')

    this.model = torchvision.models.detection.ssd300_vgg16({ pretrained: true })
    this.model.to(this.device)
    this.model.eval()

    console.log('SSD model loaded')
  }

  /**
   * Detect objects in an image
   */
  async detect(image: any, cameraModel?: CameraModel): Promise<DetectionResult> {
    const startTime = Date.now()

    // Preprocess image
    const preprocessStart = Date.now()
    const input = await this.preprocessImage(image)
    const preprocessTime = Date.now() - preprocessStart

    // Run inference
    const inferenceStart = Date.now()
    let predictions: any

    if (this.config.model.startsWith('yolov8')) {
      predictions = await this.runYOLOv8Inference(input)
    } else {
      predictions = await this.runTorchvisionInference(input)
    }
    const inferenceTime = Date.now() - inferenceStart

    // Post-process predictions
    const postprocessStart = Date.now()
    const objects = await this.postprocessPredictions(predictions, image, cameraModel)
    const postprocessTime = Date.now() - postprocessStart

    return {
      objects,
      inferenceTime,
      preprocessTime,
      postprocessTime
    }
  }

  /**
   * Preprocess image for model input
   */
  private async preprocessImage(image: any): Promise<any> {
    let tensor: any

    if (this.config.model.startsWith('yolov8')) {
      // YOLOv8 preprocessing
      // Convert BGR to RGB
      const rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

      // Resize to model input size
      const resized = cv2.resize(rgb, [640, 640])

      // Convert to tensor and normalize
      tensor = torch.from_numpy(resized).permute([2, 0, 1]).float() / 255.0
      tensor = tensor.unsqueeze(0).to(this.device)
    } else {
      // Faster R-CNN / SSD preprocessing
      // Convert BGR to RGB
      const rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

      // Convert to tensor
      tensor = torch.from_numpy(rgb).permute([2, 0, 1]).float() / 255.0
      tensor = tensor.to(this.device)
    }

    return tensor
  }

  /**
   * Run YOLOv8 inference
   */
  private async runYOLOv8Inference(input: any): Promise<any> {
    // Disable gradient computation for inference
    const noGrad = torch.no_grad()

    try {
      const results = await this.model(input)
      return results
    } finally {
      // Clean up
    }
  }

  /**
   * Run Torchvision model inference
   */
  private async runTorchvisionInference(input: any): Promise<any> {
    const noGrad = torch.no_grad()

    try {
      const predictions = await this.model([input])
      return predictions[0]
    } finally {
      // Clean up
    }
  }

  /**
   * Post-process predictions into DetectedObject array
   */
  private async postprocessPredictions(
    predictions: any,
    image: any,
    cameraModel?: CameraModel
  ): Promise<DetectedObject[]> {
    const objects: DetectedObject[] = []
    const timestamp = Date.now()

    if (this.config.model.startsWith('yolov8')) {
      // Process YOLOv8 results
      for (const result of predictions) {
        const boxes = result.boxes
        if (!boxes) continue

        const xyxy = boxes.xyxy.cpu().numpy()
        const conf = boxes.conf.cpu().numpy()
        const cls = boxes.cls.cpu().numpy()

        for (let i = 0; i < xyxy.length; i++) {
          if (conf[i] < this.config.confidenceThreshold) continue

          const [x1, y1, x2, y2] = xyxy[i]
          const classId = Math.floor(cls[i])
          const className = ObjectDetector.COCO_CLASSES[classId] || 'unknown'
          const objectClass = ObjectDetector.CLASS_MAPPING[className] || ObjectClass.OBSTACLE

          const bbox: BoundingBox2D = {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            width: x2 - x1,
            height: y2 - y1
          }

          const obj: DetectedObject = {
            id: this.nextObjectId++,
            class: objectClass,
            confidence: conf[i],
            bbox,
            timestamp
          }

          // Estimate 3D position if camera model is available
          if (cameraModel) {
            this.estimate3DPosition(obj, cameraModel)
          }

          objects.push(obj)
        }
      }
    } else {
      // Process Faster R-CNN / SSD results
      const boxes = predictions.boxes.cpu().numpy()
      const scores = predictions.scores.cpu().numpy()
      const labels = predictions.labels.cpu().numpy()

      for (let i = 0; i < boxes.length; i++) {
        if (scores[i] < this.config.confidenceThreshold) continue

        const [x1, y1, x2, y2] = boxes[i]
        const classId = labels[i]
        const className = ObjectDetector.COCO_CLASSES[classId] || 'unknown'
        const objectClass = ObjectDetector.CLASS_MAPPING[className] || ObjectClass.OBSTACLE

        const bbox: BoundingBox2D = {
          x: (x1 + x2) / 2,
          y: (y1 + y2) / 2,
          width: x2 - x1,
          height: y2 - y1
        }

        const obj: DetectedObject = {
          id: this.nextObjectId++,
          class: objectClass,
          confidence: scores[i],
          bbox,
          timestamp
        }

        // Estimate 3D position if camera model is available
        if (cameraModel) {
          this.estimate3DPosition(obj, cameraModel)
        }

        objects.push(obj)
      }
    }

    // Filter by class if specified
    if (this.config.classes && this.config.classes.length > 0) {
      return objects.filter(obj => this.config.classes!.includes(obj.class))
    }

    return objects
  }

  /**
   * Estimate 3D position from 2D bounding box
   */
  private estimate3DPosition(obj: DetectedObject, camera: CameraModel): void {
    // Simple distance estimation based on object height
    // This is a simplified approach; real systems use more sophisticated methods

    const objectHeights: Record<ObjectClass, number> = {
      [ObjectClass.PEDESTRIAN]: 1.7,
      [ObjectClass.CAR]: 1.5,
      [ObjectClass.TRUCK]: 3.0,
      [ObjectClass.BUS]: 3.5,
      [ObjectClass.BICYCLE]: 1.2,
      [ObjectClass.MOTORCYCLE]: 1.3,
      [ObjectClass.TRAFFIC_SIGN]: 0.5,
      [ObjectClass.TRAFFIC_LIGHT]: 0.3,
      [ObjectClass.OBSTACLE]: 1.0,
      [ObjectClass.CONE]: 0.7,
      [ObjectClass.BARRIER]: 1.0,
      [ObjectClass.UNKNOWN]: 1.0
    }

    const realHeight = objectHeights[obj.class] || 1.5
    const imageHeight = obj.bbox.height
    const focalLength = camera.fy

    // Distance estimation: d = (real_height * focal_length) / image_height
    const distance = (realHeight * focalLength) / imageHeight

    // Calculate 3D position in camera frame
    const u = obj.bbox.x
    const v = obj.bbox.y

    // Unproject to 3D
    const x = (u - camera.cx) * distance / camera.fx
    const y = (v - camera.cy) * distance / camera.fy
    const z = distance

    obj.position = { x, y, z }
    obj.distance = distance

    // Estimate 3D bounding box
    const objectWidths: Record<ObjectClass, number> = {
      [ObjectClass.PEDESTRIAN]: 0.6,
      [ObjectClass.CAR]: 1.8,
      [ObjectClass.TRUCK]: 2.5,
      [ObjectClass.BUS]: 2.8,
      [ObjectClass.BICYCLE]: 0.6,
      [ObjectClass.MOTORCYCLE]: 0.8,
      [ObjectClass.TRAFFIC_SIGN]: 0.3,
      [ObjectClass.TRAFFIC_LIGHT]: 0.2,
      [ObjectClass.OBSTACLE]: 1.0,
      [ObjectClass.CONE]: 0.3,
      [ObjectClass.BARRIER]: 1.0,
      [ObjectClass.UNKNOWN]: 1.0
    }

    const objectDepths: Record<ObjectClass, number> = {
      [ObjectClass.PEDESTRIAN]: 0.4,
      [ObjectClass.CAR]: 4.5,
      [ObjectClass.TRUCK]: 8.0,
      [ObjectClass.BUS]: 12.0,
      [ObjectClass.BICYCLE]: 1.8,
      [ObjectClass.MOTORCYCLE]: 2.0,
      [ObjectClass.TRAFFIC_SIGN]: 0.05,
      [ObjectClass.TRAFFIC_LIGHT]: 0.2,
      [ObjectClass.OBSTACLE]: 1.0,
      [ObjectClass.CONE]: 0.3,
      [ObjectClass.BARRIER]: 0.2,
      [ObjectClass.UNKNOWN]: 1.0
    }

    obj.bbox3d = {
      center: obj.position,
      size: {
        x: objectDepths[obj.class] || 1.0,
        y: objectWidths[obj.class] || 1.0,
        z: realHeight
      },
      rotation: { w: 1, x: 0, y: 0, z: 0 }
    }
  }

  /**
   * Track objects across frames using Kalman filter
   */
  async track(currentDetections: DetectedObject[]): Promise<DetectedObject[]> {
    const trackedObjects: DetectedObject[] = []

    // Associate detections with existing tracks
    const associations = this.associateDetections(currentDetections)

    // Update existing tracks
    for (const [trackId, detection] of associations.matched) {
      const state = this.trackingStates.get(trackId)!
      this.updateTrack(state, detection)
      state.consecutiveDetections++
      state.consecutiveMisses = 0
      state.age++

      trackedObjects.push({
        ...detection,
        trackingId: trackId,
        trackingConfidence: Math.min(state.consecutiveDetections / 5, 1.0)
      })
    }

    // Create new tracks for unmatched detections
    for (const detection of associations.unmatched) {
      const trackId = this.createTrack(detection)
      trackedObjects.push({
        ...detection,
        trackingId: trackId,
        trackingConfidence: 0.2
      })
    }

    // Update missed tracks
    for (const trackId of associations.missed) {
      const state = this.trackingStates.get(trackId)!
      state.consecutiveMisses++
      state.consecutiveDetections = Math.max(0, state.consecutiveDetections - 1)
      state.age++

      // Remove track if missed too many times
      if (state.consecutiveMisses > 10) {
        this.trackingStates.delete(trackId)
      } else {
        // Predict position for missed track
        const predicted = this.predictTrackPosition(state)
        trackedObjects.push({
          ...predicted,
          trackingId: trackId,
          trackingConfidence: Math.max(0, state.consecutiveDetections / 10)
        })
      }
    }

    return trackedObjects
  }

  /**
   * Associate detections with existing tracks
   */
  private associateDetections(detections: DetectedObject[]): {
    matched: Map<number, DetectedObject>
    unmatched: DetectedObject[]
    missed: number[]
  } {
    const matched = new Map<number, DetectedObject>()
    const unmatched: DetectedObject[] = []
    const usedDetections = new Set<number>()
    const usedTracks = new Set<number>()

    // Compute cost matrix (IoU-based)
    const costMatrix: number[][] = []
    const trackIds: number[] = []

    for (const [trackId, state] of this.trackingStates) {
      trackIds.push(trackId)
      const costs: number[] = []

      for (const detection of detections) {
        const iou = this.computeIoU(state.object.bbox, detection.bbox)
        costs.push(1 - iou) // Convert similarity to cost
      }

      costMatrix.push(costs)
    }

    // Simple greedy matching (in production, use Hungarian algorithm)
    for (let i = 0; i < trackIds.length; i++) {
      let minCost = Infinity
      let minIdx = -1

      for (let j = 0; j < detections.length; j++) {
        if (usedDetections.has(j)) continue
        if (costMatrix[i][j] < minCost) {
          minCost = costMatrix[i][j]
          minIdx = j
        }
      }

      if (minIdx !== -1 && minCost < 0.5) { // IoU threshold of 0.5
        matched.set(trackIds[i], detections[minIdx])
        usedDetections.add(minIdx)
        usedTracks.add(trackIds[i])
      }
    }

    // Unmatched detections
    for (let j = 0; j < detections.length; j++) {
      if (!usedDetections.has(j)) {
        unmatched.push(detections[j])
      }
    }

    // Missed tracks
    const missed: number[] = []
    for (const trackId of trackIds) {
      if (!usedTracks.has(trackId)) {
        missed.push(trackId)
      }
    }

    return { matched, unmatched, missed }
  }

  /**
   * Compute Intersection over Union (IoU)
   */
  private computeIoU(box1: BoundingBox2D, box2: BoundingBox2D): number {
    const x1_min = box1.x - box1.width / 2
    const y1_min = box1.y - box1.height / 2
    const x1_max = box1.x + box1.width / 2
    const y1_max = box1.y + box1.height / 2

    const x2_min = box2.x - box2.width / 2
    const y2_min = box2.y - box2.height / 2
    const x2_max = box2.x + box2.width / 2
    const y2_max = box2.y + box2.height / 2

    const intersect_x_min = Math.max(x1_min, x2_min)
    const intersect_y_min = Math.max(y1_min, y2_min)
    const intersect_x_max = Math.min(x1_max, x2_max)
    const intersect_y_max = Math.min(y1_max, y2_max)

    const intersect_area = Math.max(0, intersect_x_max - intersect_x_min) *
                          Math.max(0, intersect_y_max - intersect_y_min)

    const box1_area = box1.width * box1.height
    const box2_area = box2.width * box2.height

    const union_area = box1_area + box2_area - intersect_area

    return union_area > 0 ? intersect_area / union_area : 0
  }

  /**
   * Create new track
   */
  private createTrack(detection: DetectedObject): number {
    const trackId = this.nextObjectId++

    // Initialize Kalman filter
    const kalmanFilter = this.initializeKalmanFilter(detection)

    const state: TrackingState = {
      id: trackId,
      object: detection,
      age: 1,
      consecutiveDetections: 1,
      consecutiveMisses: 0,
      kalmanFilter,
      history: [detection]
    }

    this.trackingStates.set(trackId, state)

    return trackId
  }

  /**
   * Update existing track
   */
  private updateTrack(state: TrackingState, detection: DetectedObject): void {
    // Update Kalman filter
    this.updateKalmanFilter(state.kalmanFilter, detection)

    // Update state
    state.object = detection
    state.history.push(detection)

    // Keep history limited
    if (state.history.length > 30) {
      state.history.shift()
    }

    // Estimate velocity from history
    if (state.history.length >= 2) {
      const prev = state.history[state.history.length - 2]
      const curr = detection
      const dt = (curr.timestamp - prev.timestamp) / 1000

      if (prev.position && curr.position && dt > 0) {
        detection.velocity = {
          x: (curr.position.x - prev.position.x) / dt,
          y: (curr.position.y - prev.position.y) / dt,
          z: (curr.position.z - prev.position.z) / dt
        }

        detection.speed = Math.sqrt(
          detection.velocity.x ** 2 +
          detection.velocity.y ** 2 +
          detection.velocity.z ** 2
        )
      }
    }
  }

  /**
   * Predict track position
   */
  private predictTrackPosition(state: TrackingState): DetectedObject {
    // Use Kalman filter to predict next position
    const predicted = this.predictKalmanFilter(state.kalmanFilter)

    return {
      ...state.object,
      bbox: predicted.bbox,
      position: predicted.position,
      timestamp: Date.now()
    }
  }

  /**
   * Initialize Kalman filter for tracking
   */
  private initializeKalmanFilter(detection: DetectedObject): any {
    // State vector: [x, y, vx, vy]
    // For simplicity, we'll use a basic implementation
    return {
      state: [
        detection.bbox.x,
        detection.bbox.y,
        0, // vx
        0  // vy
      ],
      covariance: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 10, 0],
        [0, 0, 0, 10]
      ],
      processNoise: 0.1,
      measurementNoise: 1.0
    }
  }

  /**
   * Update Kalman filter with new measurement
   */
  private updateKalmanFilter(kf: any, detection: DetectedObject): void {
    const measurement = [detection.bbox.x, detection.bbox.y]

    // Simplified Kalman update
    const predicted = this.predictKalmanFilter(kf)

    // Compute Kalman gain (simplified)
    const K = 0.5

    // Update state
    kf.state[0] = predicted.state[0] + K * (measurement[0] - predicted.state[0])
    kf.state[1] = predicted.state[1] + K * (measurement[1] - predicted.state[1])
  }

  /**
   * Predict next state with Kalman filter
   */
  private predictKalmanFilter(kf: any): any {
    const dt = 0.1 // Assume 10Hz

    const predicted = {
      state: [
        kf.state[0] + kf.state[2] * dt,
        kf.state[1] + kf.state[3] * dt,
        kf.state[2],
        kf.state[3]
      ],
      bbox: {
        x: kf.state[0] + kf.state[2] * dt,
        y: kf.state[1] + kf.state[3] * dt,
        width: 0,
        height: 0
      },
      position: undefined as Vector3D | undefined
    }

    return predicted
  }

  /**
   * Visualize detections on image
   */
  async visualize(image: any, objects: DetectedObject[]): Promise<any> {
    const output = image.copy()

    for (const obj of objects) {
      const color = this.getClassColor(obj.class)
      const bbox = obj.bbox

      const x1 = Math.floor(bbox.x - bbox.width / 2)
      const y1 = Math.floor(bbox.y - bbox.height / 2)
      const x2 = Math.floor(bbox.x + bbox.width / 2)
      const y2 = Math.floor(bbox.y + bbox.height / 2)

      // Draw bounding box
      cv2.rectangle(output, [x1, y1], [x2, y2], color, 2)

      // Draw label
      const label = `${obj.class} ${(obj.confidence * 100).toFixed(0)}%`
      if (obj.distance) {
        label += ` ${obj.distance.toFixed(1)}m`
      }

      cv2.putText(
        output,
        label,
        [x1, y1 - 10],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        color,
        2
      )

      // Draw tracking ID if available
      if (obj.trackingId !== undefined) {
        cv2.putText(
          output,
          `#${obj.trackingId}`,
          [x1, y2 + 20],
          cv2.FONT_HERSHEY_SIMPLEX,
          0.5,
          color,
          2
        )
      }
    }

    return output
  }

  /**
   * Get color for object class
   */
  private getClassColor(objClass: ObjectClass): [number, number, number] {
    const colors: Record<ObjectClass, [number, number, number]> = {
      [ObjectClass.PEDESTRIAN]: [255, 0, 0],
      [ObjectClass.CAR]: [0, 255, 0],
      [ObjectClass.TRUCK]: [0, 0, 255],
      [ObjectClass.BUS]: [255, 255, 0],
      [ObjectClass.BICYCLE]: [255, 0, 255],
      [ObjectClass.MOTORCYCLE]: [0, 255, 255],
      [ObjectClass.TRAFFIC_SIGN]: [128, 0, 128],
      [ObjectClass.TRAFFIC_LIGHT]: [255, 128, 0],
      [ObjectClass.OBSTACLE]: [128, 128, 128],
      [ObjectClass.CONE]: [255, 165, 0],
      [ObjectClass.BARRIER]: [165, 42, 42],
      [ObjectClass.UNKNOWN]: [255, 255, 255]
    }

    return colors[objClass] || [255, 255, 255]
  }

  /**
   * Get detection statistics
   */
  getStatistics(): any {
    const classCount: Record<string, number> = {}
    let totalConfidence = 0
    let count = 0

    for (const state of this.trackingStates.values()) {
      const obj = state.object
      classCount[obj.class] = (classCount[obj.class] || 0) + 1
      totalConfidence += obj.confidence
      count++
    }

    return {
      activeTracks: this.trackingStates.size,
      totalDetections: count,
      averageConfidence: count > 0 ? totalConfidence / count : 0,
      classCounts: classCount
    }
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.trackingStates.clear()
    this.nextObjectId = 0
  }
}

/**
 * Utility functions for object detection
 */

export function filterObjectsByClass(
  objects: DetectedObject[],
  classes: ObjectClass[]
): DetectedObject[] {
  return objects.filter(obj => classes.includes(obj.class))
}

export function filterObjectsByConfidence(
  objects: DetectedObject[],
  minConfidence: number
): DetectedObject[] {
  return objects.filter(obj => obj.confidence >= minConfidence)
}

export function filterObjectsByDistance(
  objects: DetectedObject[],
  maxDistance: number
): DetectedObject[] {
  return objects.filter(obj => !obj.distance || obj.distance <= maxDistance)
}

export function sortObjectsByDistance(objects: DetectedObject[]): DetectedObject[] {
  return [...objects].sort((a, b) => {
    const distA = a.distance ?? Infinity
    const distB = b.distance ?? Infinity
    return distA - distB
  })
}

export function getNearestObject(
  objects: DetectedObject[],
  position: Vector3D
): DetectedObject | undefined {
  if (objects.length === 0) return undefined

  let nearest = objects[0]
  let minDist = Infinity

  for (const obj of objects) {
    if (!obj.position) continue

    const dist = Math.sqrt(
      (obj.position.x - position.x) ** 2 +
      (obj.position.y - position.y) ** 2 +
      (obj.position.z - position.z) ** 2
    )

    if (dist < minDist) {
      minDist = dist
      nearest = obj
    }
  }

  return nearest
}

export function computeObjectOverlap(obj1: DetectedObject, obj2: DetectedObject): number {
  if (!obj1.bbox3d || !obj2.bbox3d) {
    // Use 2D overlap
    const box1 = obj1.bbox
    const box2 = obj2.bbox

    const x1_min = box1.x - box1.width / 2
    const y1_min = box1.y - box1.height / 2
    const x1_max = box1.x + box1.width / 2
    const y1_max = box1.y + box1.height / 2

    const x2_min = box2.x - box2.width / 2
    const y2_min = box2.y - box2.height / 2
    const x2_max = box2.x + box2.width / 2
    const y2_max = box2.y + box2.height / 2

    const intersect_x_min = Math.max(x1_min, x2_min)
    const intersect_y_min = Math.max(y1_min, y2_min)
    const intersect_x_max = Math.min(x1_max, x2_max)
    const intersect_y_max = Math.min(y1_max, y2_max)

    const intersect_area = Math.max(0, intersect_x_max - intersect_x_min) *
                          Math.max(0, intersect_y_max - intersect_y_min)

    const box1_area = box1.width * box1.height
    const box2_area = box2.width * box2.height

    const union_area = box1_area + box2_area - intersect_area

    return union_area > 0 ? intersect_area / union_area : 0
  }

  // 3D overlap computation would go here
  return 0
}

export default ObjectDetector
