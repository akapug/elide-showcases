/**
 * Computer Vision Platform - Pose Estimation
 *
 * Advanced pose estimation using MediaPipe via Elide's polyglot bridge
 * Demonstrates seamless Python-TypeScript integration
 */

// @ts-ignore - Elide polyglot import
import mediapipe from 'python:mediapipe';
// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import {
  ImageData,
  Point,
  BoundingBox,
  PoseKeypoint,
  PoseEstimation,
  MultiPersonPose,
  Color,
} from '../types.js';

// ============================================================================
// Pose Estimation Types
// ============================================================================

export interface BodyPoseLandmarks {
  nose: Point;
  leftEyeInner: Point;
  leftEye: Point;
  leftEyeOuter: Point;
  rightEyeInner: Point;
  rightEye: Point;
  rightEyeOuter: Point;
  leftEar: Point;
  rightEar: Point;
  mouthLeft: Point;
  mouthRight: Point;
  leftShoulder: Point;
  rightShoulder: Point;
  leftElbow: Point;
  rightElbow: Point;
  leftWrist: Point;
  rightWrist: Point;
  leftPinky: Point;
  rightPinky: Point;
  leftIndex: Point;
  rightIndex: Point;
  leftThumb: Point;
  rightThumb: Point;
  leftHip: Point;
  rightHip: Point;
  leftKnee: Point;
  rightKnee: Point;
  leftAnkle: Point;
  rightAnkle: Point;
  leftHeel: Point;
  rightHeel: Point;
  leftFootIndex: Point;
  rightFootIndex: Point;
}

export interface HandLandmarks {
  wrist: Point;
  thumbCMC: Point;
  thumbMCP: Point;
  thumbIP: Point;
  thumbTip: Point;
  indexMCP: Point;
  indexPIP: Point;
  indexDIP: Point;
  indexTip: Point;
  middleMCP: Point;
  middlePIP: Point;
  middleDIP: Point;
  middleTip: Point;
  ringMCP: Point;
  ringPIP: Point;
  ringDIP: Point;
  ringTip: Point;
  pinkyMCP: Point;
  pinkyPIP: Point;
  pinkyDIP: Point;
  pinkyTip: Point;
}

export interface FaceMeshLandmarks {
  silhouette: Point[];
  leftEyebrow: Point[];
  rightEyebrow: Point[];
  leftEye: Point[];
  rightEye: Point[];
  leftIris: Point[];
  rightIris: Point[];
  nose: Point[];
  lips: Point[];
  facialContour: Point[];
}

export interface FullBodyPose {
  bodyLandmarks: BodyPoseLandmarks;
  bodyConfidence: number;
  leftHand?: HandLandmarks;
  rightHand?: HandLandmarks;
  handConfidence?: { left: number; right: number };
  faceMesh?: FaceMeshLandmarks;
  faceConfidence?: number;
  worldLandmarks?: any; // 3D coordinates
  visibility?: number[];
}

export interface PoseEstimatorConfig {
  modelComplexity?: 0 | 1 | 2; // 0=Lite, 1=Full, 2=Heavy
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  enableSegmentation?: boolean;
  smoothLandmarks?: boolean;
  staticImageMode?: boolean;
}

export interface HandDetectorConfig {
  maxNumHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  staticImageMode?: boolean;
}

export interface FaceMeshConfig {
  maxNumFaces?: number;
  refineNose?: boolean;
  refineEyes?: boolean;
  refineLips?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  staticImageMode?: boolean;
}

export interface PoseTrackingState {
  previousPose?: FullBodyPose;
  trackingQuality: number;
  smoothingWindow: number;
  velocityEstimate?: {
    bodyVelocity: Point[];
    handVelocity: Point[];
  };
}

export interface GestureRecognitionResult {
  gesture: string;
  confidence: number;
  handedness: 'left' | 'right';
  landmarks: HandLandmarks;
}

export interface ActivityRecognitionResult {
  activity: string;
  confidence: number;
  duration: number;
  keyPoses: FullBodyPose[];
}

// ============================================================================
// Pose Estimator Class
// ============================================================================

export class PoseEstimator {
  private poseModel: any;
  private handsModel: any;
  private faceMeshModel: any;
  private config: Required<PoseEstimatorConfig>;
  private handsConfig: Required<HandDetectorConfig>;
  private faceConfig: Required<FaceMeshConfig>;
  private trackingState: PoseTrackingState;
  private poseHistory: FullBodyPose[] = [];
  private gestureClassifier: GestureClassifier;
  private activityRecognizer: ActivityRecognizer;

  constructor(
    config: PoseEstimatorConfig = {},
    handsConfig: HandDetectorConfig = {},
    faceConfig: FaceMeshConfig = {}
  ) {
    this.config = {
      modelComplexity: config.modelComplexity ?? 1,
      minDetectionConfidence: config.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
      enableSegmentation: config.enableSegmentation ?? false,
      smoothLandmarks: config.smoothLandmarks ?? true,
      staticImageMode: config.staticImageMode ?? false,
    };

    this.handsConfig = {
      maxNumHands: handsConfig.maxNumHands ?? 2,
      minDetectionConfidence: handsConfig.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: handsConfig.minTrackingConfidence ?? 0.5,
      staticImageMode: handsConfig.staticImageMode ?? false,
    };

    this.faceConfig = {
      maxNumFaces: faceConfig.maxNumFaces ?? 1,
      refineNose: faceConfig.refineNose ?? false,
      refineEyes: faceConfig.refineEyes ?? false,
      refineLips: faceConfig.refineLips ?? false,
      minDetectionConfidence: faceConfig.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: faceConfig.minTrackingConfidence ?? 0.5,
      staticImageMode: faceConfig.staticImageMode ?? false,
    };

    this.trackingState = {
      trackingQuality: 0,
      smoothingWindow: 5,
    };

    this.gestureClassifier = new GestureClassifier();
    this.activityRecognizer = new ActivityRecognizer();

    this.initializeModels();
  }

  private initializeModels(): void {
    // Initialize MediaPipe Pose
    this.poseModel = mediapipe.solutions.pose.Pose({
      static_image_mode: this.config.staticImageMode,
      model_complexity: this.config.modelComplexity,
      smooth_landmarks: this.config.smoothLandmarks,
      enable_segmentation: this.config.enableSegmentation,
      min_detection_confidence: this.config.minDetectionConfidence,
      min_tracking_confidence: this.config.minTrackingConfidence,
    });

    // Initialize MediaPipe Hands
    this.handsModel = mediapipe.solutions.hands.Hands({
      static_image_mode: this.handsConfig.staticImageMode,
      max_num_hands: this.handsConfig.maxNumHands,
      min_detection_confidence: this.handsConfig.minDetectionConfidence,
      min_tracking_confidence: this.handsConfig.minTrackingConfidence,
    });

    // Initialize MediaPipe Face Mesh
    this.faceMeshModel = mediapipe.solutions.face_mesh.FaceMesh({
      static_image_mode: this.faceConfig.staticImageMode,
      max_num_faces: this.faceConfig.maxNumFaces,
      refine_landmarks: this.faceConfig.refineNose || this.faceConfig.refineEyes,
      min_detection_confidence: this.faceConfig.minDetectionConfidence,
      min_tracking_confidence: this.faceConfig.minTrackingConfidence,
    });
  }

  /**
   * Estimate full body pose from image
   */
  async estimateFullPose(image: ImageData): Promise<FullBodyPose | null> {
    const startTime = Date.now();

    // Convert to RGB for MediaPipe
    const rgbImage = this.prepareImage(image);

    // Process with pose model
    const poseResults = this.poseModel.process(rgbImage);
    if (!poseResults.pose_landmarks) {
      return null;
    }

    // Extract body landmarks
    const bodyLandmarks = this.extractBodyLandmarks(
      poseResults.pose_landmarks,
      image.width,
      image.height
    );

    const bodyConfidence = this.calculatePoseConfidence(
      poseResults.pose_landmarks
    );

    // Detect hands
    let leftHand: HandLandmarks | undefined;
    let rightHand: HandLandmarks | undefined;
    let handConfidence: { left: number; right: number } | undefined;

    const handsResults = this.handsModel.process(rgbImage);
    if (handsResults.multi_hand_landmarks) {
      const hands = this.extractHandLandmarks(
        handsResults.multi_hand_landmarks,
        handsResults.multi_handedness,
        image.width,
        image.height
      );

      leftHand = hands.left;
      rightHand = hands.right;
      handConfidence = {
        left: hands.leftConfidence ?? 0,
        right: hands.rightConfidence ?? 0,
      };
    }

    // Detect face mesh
    let faceMesh: FaceMeshLandmarks | undefined;
    let faceConfidence: number | undefined;

    const faceResults = this.faceMeshModel.process(rgbImage);
    if (faceResults.multi_face_landmarks && faceResults.multi_face_landmarks.length > 0) {
      faceMesh = this.extractFaceMeshLandmarks(
        faceResults.multi_face_landmarks[0],
        image.width,
        image.height
      );
      faceConfidence = 0.9; // MediaPipe doesn't provide face confidence directly
    }

    const fullPose: FullBodyPose = {
      bodyLandmarks,
      bodyConfidence,
      leftHand,
      rightHand,
      handConfidence,
      faceMesh,
      faceConfidence,
      worldLandmarks: poseResults.pose_world_landmarks,
      visibility: this.extractVisibility(poseResults.pose_landmarks),
    };

    // Apply smoothing if enabled
    if (this.config.smoothLandmarks) {
      this.smoothPose(fullPose);
    }

    // Update pose history
    this.poseHistory.push(fullPose);
    if (this.poseHistory.length > 30) {
      this.poseHistory.shift();
    }

    // Update tracking state
    this.updateTrackingState(fullPose);

    const processingTime = Date.now() - startTime;
    console.log(`Pose estimation: ${processingTime}ms`);

    return fullPose;
  }

  /**
   * Extract 33 body landmarks
   */
  private extractBodyLandmarks(
    landmarks: any,
    width: number,
    height: number
  ): BodyPoseLandmarks {
    const extractPoint = (idx: number): Point => ({
      x: landmarks.landmark[idx].x * width,
      y: landmarks.landmark[idx].y * height,
    });

    return {
      nose: extractPoint(0),
      leftEyeInner: extractPoint(1),
      leftEye: extractPoint(2),
      leftEyeOuter: extractPoint(3),
      rightEyeInner: extractPoint(4),
      rightEye: extractPoint(5),
      rightEyeOuter: extractPoint(6),
      leftEar: extractPoint(7),
      rightEar: extractPoint(8),
      mouthLeft: extractPoint(9),
      mouthRight: extractPoint(10),
      leftShoulder: extractPoint(11),
      rightShoulder: extractPoint(12),
      leftElbow: extractPoint(13),
      rightElbow: extractPoint(14),
      leftWrist: extractPoint(15),
      rightWrist: extractPoint(16),
      leftPinky: extractPoint(17),
      rightPinky: extractPoint(18),
      leftIndex: extractPoint(19),
      rightIndex: extractPoint(20),
      leftThumb: extractPoint(21),
      rightThumb: extractPoint(22),
      leftHip: extractPoint(23),
      rightHip: extractPoint(24),
      leftKnee: extractPoint(25),
      rightKnee: extractPoint(26),
      leftAnkle: extractPoint(27),
      rightAnkle: extractPoint(28),
      leftHeel: extractPoint(29),
      rightHeel: extractPoint(30),
      leftFootIndex: extractPoint(31),
      rightFootIndex: extractPoint(32),
    };
  }

  /**
   * Extract hand landmarks (21 points per hand)
   */
  private extractHandLandmarks(
    multiHandLandmarks: any,
    multiHandedness: any,
    width: number,
    height: number
  ): {
    left?: HandLandmarks;
    right?: HandLandmarks;
    leftConfidence?: number;
    rightConfidence?: number;
  } {
    let left: HandLandmarks | undefined;
    let right: HandLandmarks | undefined;
    let leftConfidence: number | undefined;
    let rightConfidence: number | undefined;

    for (let i = 0; i < multiHandLandmarks.length; i++) {
      const landmarks = multiHandLandmarks[i];
      const handedness = multiHandedness[i].classification[0];
      const isLeft = handedness.label === 'Left';
      const confidence = handedness.score;

      const extractPoint = (idx: number): Point => ({
        x: landmarks.landmark[idx].x * width,
        y: landmarks.landmark[idx].y * height,
      });

      const handLandmarks: HandLandmarks = {
        wrist: extractPoint(0),
        thumbCMC: extractPoint(1),
        thumbMCP: extractPoint(2),
        thumbIP: extractPoint(3),
        thumbTip: extractPoint(4),
        indexMCP: extractPoint(5),
        indexPIP: extractPoint(6),
        indexDIP: extractPoint(7),
        indexTip: extractPoint(8),
        middleMCP: extractPoint(9),
        middlePIP: extractPoint(10),
        middleDIP: extractPoint(11),
        middleTip: extractPoint(12),
        ringMCP: extractPoint(13),
        ringPIP: extractPoint(14),
        ringDIP: extractPoint(15),
        ringTip: extractPoint(16),
        pinkyMCP: extractPoint(17),
        pinkyPIP: extractPoint(18),
        pinkyDIP: extractPoint(19),
        pinkyTip: extractPoint(20),
      };

      if (isLeft) {
        left = handLandmarks;
        leftConfidence = confidence;
      } else {
        right = handLandmarks;
        rightConfidence = confidence;
      }
    }

    return { left, right, leftConfidence, rightConfidence };
  }

  /**
   * Extract face mesh landmarks (468 points)
   */
  private extractFaceMeshLandmarks(
    landmarks: any,
    width: number,
    height: number
  ): FaceMeshLandmarks {
    const extractPoint = (idx: number): Point => ({
      x: landmarks.landmark[idx].x * width,
      y: landmarks.landmark[idx].y * height,
    });

    const extractPoints = (indices: number[]): Point[] =>
      indices.map(extractPoint);

    // Face mesh landmark indices (simplified version)
    const silhouetteIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    const leftEyebrowIndices = [276, 283, 282, 295, 285];
    const rightEyebrowIndices = [46, 53, 52, 65, 55];
    const leftEyeIndices = [263, 249, 390, 373, 374, 380, 381, 382, 362];
    const rightEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133];
    const noseIndices = [1, 2, 98, 327];
    const lipsIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

    return {
      silhouette: extractPoints(silhouetteIndices),
      leftEyebrow: extractPoints(leftEyebrowIndices),
      rightEyebrow: extractPoints(rightEyebrowIndices),
      leftEye: extractPoints(leftEyeIndices),
      rightEye: extractPoints(rightEyeIndices),
      leftIris: extractPoints([468, 469, 470, 471, 472]),
      rightIris: extractPoints([473, 474, 475, 476, 477]),
      nose: extractPoints(noseIndices),
      lips: extractPoints(lipsIndices),
      facialContour: extractPoints(silhouetteIndices),
    };
  }

  /**
   * Calculate visibility scores for landmarks
   */
  private extractVisibility(landmarks: any): number[] {
    const visibility: number[] = [];
    for (let i = 0; i < landmarks.landmark.length; i++) {
      visibility.push(landmarks.landmark[i].visibility ?? 1.0);
    }
    return visibility;
  }

  /**
   * Calculate overall pose confidence
   */
  private calculatePoseConfidence(landmarks: any): number {
    const visibilities: number[] = [];
    for (let i = 0; i < landmarks.landmark.length; i++) {
      const vis = landmarks.landmark[i].visibility ?? 1.0;
      visibilities.push(vis);
    }

    if (visibilities.length === 0) return 0;
    return visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
  }

  /**
   * Prepare image for MediaPipe processing
   */
  private prepareImage(image: ImageData): any {
    // Convert BGR to RGB if needed
    if (image.channels === 3) {
      return cv2.cvtColor(image.data, cv2.COLOR_BGR2RGB);
    }
    return image.data;
  }

  /**
   * Apply temporal smoothing to pose
   */
  private smoothPose(pose: FullBodyPose): void {
    if (this.poseHistory.length < 2) return;

    const smoothingFactor = 0.3;
    const previousPose = this.poseHistory[this.poseHistory.length - 1];

    // Smooth body landmarks
    for (const key in pose.bodyLandmarks) {
      const landmark = pose.bodyLandmarks[key as keyof BodyPoseLandmarks];
      const prevLandmark = previousPose.bodyLandmarks[key as keyof BodyPoseLandmarks];

      landmark.x = landmark.x * smoothingFactor + prevLandmark.x * (1 - smoothingFactor);
      landmark.y = landmark.y * smoothingFactor + prevLandmark.y * (1 - smoothingFactor);
    }

    // Smooth hand landmarks
    if (pose.leftHand && previousPose.leftHand) {
      this.smoothHandLandmarks(pose.leftHand, previousPose.leftHand, smoothingFactor);
    }
    if (pose.rightHand && previousPose.rightHand) {
      this.smoothHandLandmarks(pose.rightHand, previousPose.rightHand, smoothingFactor);
    }
  }

  private smoothHandLandmarks(
    hand: HandLandmarks,
    prevHand: HandLandmarks,
    factor: number
  ): void {
    for (const key in hand) {
      const landmark = hand[key as keyof HandLandmarks];
      const prevLandmark = prevHand[key as keyof HandLandmarks];

      landmark.x = landmark.x * factor + prevLandmark.x * (1 - factor);
      landmark.y = landmark.y * factor + prevLandmark.y * (1 - factor);
    }
  }

  /**
   * Update tracking state
   */
  private updateTrackingState(pose: FullBodyPose): void {
    if (this.trackingState.previousPose) {
      // Calculate tracking quality based on landmark movement
      const movement = this.calculatePoseMovement(
        pose,
        this.trackingState.previousPose
      );
      this.trackingState.trackingQuality = Math.max(0, 1 - movement / 100);
    }

    this.trackingState.previousPose = pose;
  }

  /**
   * Calculate movement between poses
   */
  private calculatePoseMovement(pose1: FullBodyPose, pose2: FullBodyPose): number {
    let totalDistance = 0;
    let count = 0;

    for (const key in pose1.bodyLandmarks) {
      const p1 = pose1.bodyLandmarks[key as keyof BodyPoseLandmarks];
      const p2 = pose2.bodyLandmarks[key as keyof BodyPoseLandmarks];

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      count++;
    }

    return count > 0 ? totalDistance / count : 0;
  }

  /**
   * Detect gestures from hand landmarks
   */
  detectGestures(hands: {
    left?: HandLandmarks;
    right?: HandLandmarks;
  }): GestureRecognitionResult[] {
    const gestures: GestureRecognitionResult[] = [];

    if (hands.left) {
      const gesture = this.gestureClassifier.classify(hands.left);
      if (gesture) {
        gestures.push({
          gesture: gesture.name,
          confidence: gesture.confidence,
          handedness: 'left',
          landmarks: hands.left,
        });
      }
    }

    if (hands.right) {
      const gesture = this.gestureClassifier.classify(hands.right);
      if (gesture) {
        gestures.push({
          gesture: gesture.name,
          confidence: gesture.confidence,
          handedness: 'right',
          landmarks: hands.right,
        });
      }
    }

    return gestures;
  }

  /**
   * Recognize activities from pose sequence
   */
  recognizeActivity(): ActivityRecognitionResult | null {
    if (this.poseHistory.length < 10) {
      return null;
    }

    return this.activityRecognizer.recognize(this.poseHistory);
  }

  /**
   * Draw pose on image
   */
  drawPose(
    image: ImageData,
    pose: FullBodyPose,
    options: {
      drawBody?: boolean;
      drawHands?: boolean;
      drawFace?: boolean;
      color?: Color;
      thickness?: number;
    } = {}
  ): ImageData {
    const {
      drawBody = true,
      drawHands = true,
      drawFace = false,
      color = { r: 0, g: 255, b: 0 },
      thickness = 2,
    } = options;

    const output = image.data.copy();

    // Draw body skeleton
    if (drawBody) {
      this.drawBodySkeleton(output, pose.bodyLandmarks, color, thickness);
    }

    // Draw hands
    if (drawHands) {
      if (pose.leftHand) {
        this.drawHandLandmarks(output, pose.leftHand, { r: 255, g: 0, b: 0 }, thickness);
      }
      if (pose.rightHand) {
        this.drawHandLandmarks(output, pose.rightHand, { r: 0, g: 0, b: 255 }, thickness);
      }
    }

    // Draw face mesh
    if (drawFace && pose.faceMesh) {
      this.drawFaceMesh(output, pose.faceMesh, color, thickness);
    }

    return {
      data: output,
      width: image.width,
      height: image.height,
      channels: image.channels,
      dtype: image.dtype,
    };
  }

  private drawBodySkeleton(
    image: any,
    landmarks: BodyPoseLandmarks,
    color: Color,
    thickness: number
  ): void {
    const connections = [
      // Face
      ['nose', 'leftEyeInner'],
      ['leftEyeInner', 'leftEye'],
      ['leftEye', 'leftEyeOuter'],
      ['leftEyeOuter', 'leftEar'],
      ['nose', 'rightEyeInner'],
      ['rightEyeInner', 'rightEye'],
      ['rightEye', 'rightEyeOuter'],
      ['rightEyeOuter', 'rightEar'],
      // Torso
      ['leftShoulder', 'rightShoulder'],
      ['leftShoulder', 'leftHip'],
      ['rightShoulder', 'rightHip'],
      ['leftHip', 'rightHip'],
      // Arms
      ['leftShoulder', 'leftElbow'],
      ['leftElbow', 'leftWrist'],
      ['rightShoulder', 'rightElbow'],
      ['rightElbow', 'rightWrist'],
      // Legs
      ['leftHip', 'leftKnee'],
      ['leftKnee', 'leftAnkle'],
      ['rightHip', 'rightKnee'],
      ['rightKnee', 'rightAnkle'],
    ];

    for (const [start, end] of connections) {
      const p1 = landmarks[start as keyof BodyPoseLandmarks];
      const p2 = landmarks[end as keyof BodyPoseLandmarks];

      cv2.line(
        image,
        [Math.round(p1.x), Math.round(p1.y)],
        [Math.round(p2.x), Math.round(p2.y)],
        [color.b, color.g, color.r],
        thickness
      );
    }

    // Draw keypoints
    for (const key in landmarks) {
      const point = landmarks[key as keyof BodyPoseLandmarks];
      cv2.circle(
        image,
        [Math.round(point.x), Math.round(point.y)],
        4,
        [color.b, color.g, color.r],
        -1
      );
    }
  }

  private drawHandLandmarks(
    image: any,
    hand: HandLandmarks,
    color: Color,
    thickness: number
  ): void {
    const connections = [
      // Thumb
      ['wrist', 'thumbCMC'],
      ['thumbCMC', 'thumbMCP'],
      ['thumbMCP', 'thumbIP'],
      ['thumbIP', 'thumbTip'],
      // Index
      ['wrist', 'indexMCP'],
      ['indexMCP', 'indexPIP'],
      ['indexPIP', 'indexDIP'],
      ['indexDIP', 'indexTip'],
      // Middle
      ['wrist', 'middleMCP'],
      ['middleMCP', 'middlePIP'],
      ['middlePIP', 'middleDIP'],
      ['middleDIP', 'middleTip'],
      // Ring
      ['wrist', 'ringMCP'],
      ['ringMCP', 'ringPIP'],
      ['ringPIP', 'ringDIP'],
      ['ringDIP', 'ringTip'],
      // Pinky
      ['wrist', 'pinkyMCP'],
      ['pinkyMCP', 'pinkyPIP'],
      ['pinkyPIP', 'pinkyDIP'],
      ['pinkyDIP', 'pinkyTip'],
    ];

    for (const [start, end] of connections) {
      const p1 = hand[start as keyof HandLandmarks];
      const p2 = hand[end as keyof HandLandmarks];

      cv2.line(
        image,
        [Math.round(p1.x), Math.round(p1.y)],
        [Math.round(p2.x), Math.round(p2.y)],
        [color.b, color.g, color.r],
        thickness
      );
    }

    // Draw keypoints
    for (const key in hand) {
      const point = hand[key as keyof HandLandmarks];
      cv2.circle(
        image,
        [Math.round(point.x), Math.round(point.y)],
        3,
        [color.b, color.g, color.r],
        -1
      );
    }
  }

  private drawFaceMesh(
    image: any,
    mesh: FaceMeshLandmarks,
    color: Color,
    thickness: number
  ): void {
    // Draw silhouette
    for (let i = 0; i < mesh.silhouette.length - 1; i++) {
      const p1 = mesh.silhouette[i];
      const p2 = mesh.silhouette[i + 1];

      cv2.line(
        image,
        [Math.round(p1.x), Math.round(p1.y)],
        [Math.round(p2.x), Math.round(p2.y)],
        [color.b, color.g, color.r],
        thickness
      );
    }

    // Draw eyes, nose, lips
    const drawContour = (points: Point[]) => {
      for (let i = 0; i < points.length - 1; i++) {
        cv2.line(
          image,
          [Math.round(points[i].x), Math.round(points[i].y)],
          [Math.round(points[i + 1].x), Math.round(points[i + 1].y)],
          [color.b, color.g, color.r],
          thickness
        );
      }
    };

    drawContour(mesh.leftEye);
    drawContour(mesh.rightEye);
    drawContour(mesh.nose);
    drawContour(mesh.lips);
  }

  /**
   * Get tracking quality metric
   */
  getTrackingQuality(): number {
    return this.trackingState.trackingQuality;
  }

  /**
   * Reset tracking state
   */
  resetTracking(): void {
    this.trackingState = {
      trackingQuality: 0,
      smoothingWindow: 5,
    };
    this.poseHistory = [];
  }

  /**
   * Release resources
   */
  close(): void {
    if (this.poseModel) {
      this.poseModel.close();
    }
    if (this.handsModel) {
      this.handsModel.close();
    }
    if (this.faceMeshModel) {
      this.faceMeshModel.close();
    }
  }
}

// ============================================================================
// Gesture Classifier
// ============================================================================

class GestureClassifier {
  classify(hand: HandLandmarks): { name: string; confidence: number } | null {
    // Check for various gestures
    if (this.isThumbsUp(hand)) {
      return { name: 'thumbs_up', confidence: 0.9 };
    }
    if (this.isOpenPalm(hand)) {
      return { name: 'open_palm', confidence: 0.85 };
    }
    if (this.isFist(hand)) {
      return { name: 'fist', confidence: 0.9 };
    }
    if (this.isPeaceSign(hand)) {
      return { name: 'peace', confidence: 0.85 };
    }
    if (this.isPointingUp(hand)) {
      return { name: 'pointing_up', confidence: 0.8 };
    }
    if (this.isOkSign(hand)) {
      return { name: 'ok', confidence: 0.85 };
    }

    return null;
  }

  private isThumbsUp(hand: HandLandmarks): boolean {
    // Thumb extended, other fingers curled
    const thumbExtended = hand.thumbTip.y < hand.thumbMCP.y;
    const indexCurled = hand.indexTip.y > hand.indexMCP.y;
    const middleCurled = hand.middleTip.y > hand.middleMCP.y;

    return thumbExtended && indexCurled && middleCurled;
  }

  private isOpenPalm(hand: HandLandmarks): boolean {
    // All fingers extended
    const allExtended =
      hand.indexTip.y < hand.indexMCP.y &&
      hand.middleTip.y < hand.middleMCP.y &&
      hand.ringTip.y < hand.ringMCP.y &&
      hand.pinkyTip.y < hand.pinkyMCP.y;

    return allExtended;
  }

  private isFist(hand: HandLandmarks): boolean {
    // All fingers curled
    const allCurled =
      hand.indexTip.y > hand.indexMCP.y &&
      hand.middleTip.y > hand.middleMCP.y &&
      hand.ringTip.y > hand.ringMCP.y &&
      hand.pinkyTip.y > hand.pinkyMCP.y;

    return allCurled;
  }

  private isPeaceSign(hand: HandLandmarks): boolean {
    // Index and middle extended, others curled
    const indexExtended = hand.indexTip.y < hand.indexMCP.y;
    const middleExtended = hand.middleTip.y < hand.middleMCP.y;
    const ringCurled = hand.ringTip.y > hand.ringMCP.y;
    const pinkyCurled = hand.pinkyTip.y > hand.pinkyMCP.y;

    return indexExtended && middleExtended && ringCurled && pinkyCurled;
  }

  private isPointingUp(hand: HandLandmarks): boolean {
    // Only index extended
    const indexExtended = hand.indexTip.y < hand.indexMCP.y;
    const middleCurled = hand.middleTip.y > hand.middleMCP.y;
    const ringCurled = hand.ringTip.y > hand.ringMCP.y;

    return indexExtended && middleCurled && ringCurled;
  }

  private isOkSign(hand: HandLandmarks): boolean {
    // Thumb and index forming circle
    const dx = hand.thumbTip.x - hand.indexTip.x;
    const dy = hand.thumbTip.y - hand.indexTip.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 30;
  }
}

// ============================================================================
// Activity Recognizer
// ============================================================================

class ActivityRecognizer {
  recognize(poseHistory: FullBodyPose[]): ActivityRecognitionResult | null {
    if (poseHistory.length < 10) {
      return null;
    }

    // Check for various activities
    if (this.isWaving(poseHistory)) {
      return {
        activity: 'waving',
        confidence: 0.85,
        duration: poseHistory.length / 30,
        keyPoses: poseHistory.slice(-5),
      };
    }

    if (this.isJumping(poseHistory)) {
      return {
        activity: 'jumping',
        confidence: 0.8,
        duration: poseHistory.length / 30,
        keyPoses: poseHistory.slice(-5),
      };
    }

    if (this.isSquatting(poseHistory)) {
      return {
        activity: 'squatting',
        confidence: 0.75,
        duration: poseHistory.length / 30,
        keyPoses: poseHistory.slice(-5),
      };
    }

    return null;
  }

  private isWaving(poses: FullBodyPose[]): boolean {
    // Detect hand moving back and forth
    const recentPoses = poses.slice(-15);
    let changes = 0;
    let lastDirection = 0;

    for (let i = 1; i < recentPoses.length; i++) {
      const curr = recentPoses[i].bodyLandmarks.rightWrist.x;
      const prev = recentPoses[i - 1].bodyLandmarks.rightWrist.x;
      const direction = Math.sign(curr - prev);

      if (direction !== 0 && direction !== lastDirection) {
        changes++;
        lastDirection = direction;
      }
    }

    return changes >= 3;
  }

  private isJumping(poses: FullBodyPose[]): boolean {
    // Detect vertical movement of hips
    const recentPoses = poses.slice(-10);
    const hipYs = recentPoses.map(p => p.bodyLandmarks.leftHip.y);
    const maxY = Math.max(...hipYs);
    const minY = Math.min(...hipYs);

    return maxY - minY > 50;
  }

  private isSquatting(poses: FullBodyPose[]): boolean {
    // Detect bent knees with stable upper body
    const pose = poses[poses.length - 1];
    const leftKneeAngle = this.calculateAngle(
      pose.bodyLandmarks.leftHip,
      pose.bodyLandmarks.leftKnee,
      pose.bodyLandmarks.leftAnkle
    );

    return leftKneeAngle < 120;
  }

  private calculateAngle(p1: Point, p2: Point, p3: Point): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const angle = Math.acos(dot / (mag1 * mag2));
    return (angle * 180) / Math.PI;
  }
}
