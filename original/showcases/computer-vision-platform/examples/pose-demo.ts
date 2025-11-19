/**
 * Computer Vision Platform - Pose Estimation Demo
 *
 * Demonstrates advanced pose estimation capabilities using MediaPipe
 */

// @ts-ignore - Elide polyglot import
import cv2 from 'python:cv2';
// @ts-ignore - Elide polyglot import
import numpy from 'python:numpy';

import { PoseEstimator } from '../src/pose/pose-estimator.js';
import { ImageData } from '../src/types.js';

// ============================================================================
// Demo 1: Full Body Pose Detection
// ============================================================================

async function demoFullBodyPose() {
  console.log('='.repeat(80));
  console.log('Demo 1: Full Body Pose Detection');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    smoothLandmarks: true,
  });

  // Load test image
  const image = cv2.imread('examples/assets/person.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Estimate pose
  const pose = await estimator.estimateFullPose(imageData);

  if (pose) {
    console.log(`\nPose detected with confidence: ${pose.bodyConfidence.toFixed(3)}`);
    console.log(`\nBody landmarks detected: 33`);

    // Display key landmarks
    console.log('\nKey body landmarks:');
    console.log(
      `  Nose: (${pose.bodyLandmarks.nose.x.toFixed(0)}, ${pose.bodyLandmarks.nose.y.toFixed(0)})`
    );
    console.log(
      `  Left Shoulder: (${pose.bodyLandmarks.leftShoulder.x.toFixed(0)}, ${pose.bodyLandmarks.leftShoulder.y.toFixed(0)})`
    );
    console.log(
      `  Right Shoulder: (${pose.bodyLandmarks.rightShoulder.x.toFixed(0)}, ${pose.bodyLandmarks.rightShoulder.y.toFixed(0)})`
    );
    console.log(
      `  Left Hip: (${pose.bodyLandmarks.leftHip.x.toFixed(0)}, ${pose.bodyLandmarks.leftHip.y.toFixed(0)})`
    );
    console.log(
      `  Right Hip: (${pose.bodyLandmarks.rightHip.x.toFixed(0)}, ${pose.bodyLandmarks.rightHip.y.toFixed(0)})`
    );

    // Draw pose on image
    const annotated = estimator.drawPose(imageData, pose, {
      drawBody: true,
      drawHands: false,
      drawFace: false,
      color: { r: 0, g: 255, b: 0 },
      thickness: 2,
    });

    // Save result
    cv2.imwrite('output/pose_body.jpg', annotated.data);
    console.log('\nAnnotated image saved to: output/pose_body.jpg');
  } else {
    console.log('No pose detected in the image');
  }

  estimator.close();
}

// ============================================================================
// Demo 2: Hand Pose Detection
// ============================================================================

async function demoHandPose() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 2: Hand Pose Detection');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator(
    {},
    {
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
    }
  );

  // Load test image
  const image = cv2.imread('examples/assets/hands.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Estimate pose
  const pose = await estimator.estimateFullPose(imageData);

  if (pose) {
    // Check hands
    if (pose.leftHand) {
      console.log('\nLeft hand detected!');
      console.log(`  Confidence: ${pose.handConfidence?.left.toFixed(3)}`);
      console.log(`  Landmarks: 21`);
      console.log(
        `  Wrist: (${pose.leftHand.wrist.x.toFixed(0)}, ${pose.leftHand.wrist.y.toFixed(0)})`
      );
      console.log(
        `  Thumb tip: (${pose.leftHand.thumbTip.x.toFixed(0)}, ${pose.leftHand.thumbTip.y.toFixed(0)})`
      );
      console.log(
        `  Index tip: (${pose.leftHand.indexTip.x.toFixed(0)}, ${pose.leftHand.indexTip.y.toFixed(0)})`
      );
    }

    if (pose.rightHand) {
      console.log('\nRight hand detected!');
      console.log(`  Confidence: ${pose.handConfidence?.right.toFixed(3)}`);
      console.log(`  Landmarks: 21`);
      console.log(
        `  Wrist: (${pose.rightHand.wrist.x.toFixed(0)}, ${pose.rightHand.wrist.y.toFixed(0)})`
      );
      console.log(
        `  Thumb tip: (${pose.rightHand.thumbTip.x.toFixed(0)}, ${pose.rightHand.thumbTip.y.toFixed(0)})`
      );
      console.log(
        `  Index tip: (${pose.rightHand.indexTip.x.toFixed(0)}, ${pose.rightHand.indexTip.y.toFixed(0)})`
      );
    }

    // Detect gestures
    const gestures = estimator.detectGestures({
      left: pose.leftHand,
      right: pose.rightHand,
    });

    if (gestures.length > 0) {
      console.log('\nGestures detected:');
      for (const gesture of gestures) {
        console.log(
          `  ${gesture.handedness} hand: ${gesture.gesture} (confidence: ${gesture.confidence.toFixed(3)})`
        );
      }
    }

    // Draw hands on image
    const annotated = estimator.drawPose(imageData, pose, {
      drawBody: false,
      drawHands: true,
      drawFace: false,
      thickness: 2,
    });

    cv2.imwrite('output/pose_hands.jpg', annotated.data);
    console.log('\nAnnotated image saved to: output/pose_hands.jpg');
  } else {
    console.log('No hands detected in the image');
  }

  estimator.close();
}

// ============================================================================
// Demo 3: Face Mesh Detection
// ============================================================================

async function demoFaceMesh() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 3: Face Mesh Detection (468 landmarks)');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator(
    {},
    {},
    {
      maxNumFaces: 1,
      refineNose: true,
      refineEyes: true,
      refineLips: true,
      minDetectionConfidence: 0.5,
    }
  );

  // Load test image
  const image = cv2.imread('examples/assets/face.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Estimate pose
  const pose = await estimator.estimateFullPose(imageData);

  if (pose && pose.faceMesh) {
    console.log('\nFace mesh detected!');
    console.log(`  Confidence: ${pose.faceConfidence?.toFixed(3)}`);
    console.log(`  Total landmarks: 468`);
    console.log(`  Silhouette points: ${pose.faceMesh.silhouette.length}`);
    console.log(`  Left eye points: ${pose.faceMesh.leftEye.length}`);
    console.log(`  Right eye points: ${pose.faceMesh.rightEye.length}`);
    console.log(`  Lips points: ${pose.faceMesh.lips.length}`);
    console.log(`  Nose points: ${pose.faceMesh.nose.length}`);
    console.log(`  Left iris points: ${pose.faceMesh.leftIris.length}`);
    console.log(`  Right iris points: ${pose.faceMesh.rightIris.length}`);

    // Draw face mesh on image
    const annotated = estimator.drawPose(imageData, pose, {
      drawBody: false,
      drawHands: false,
      drawFace: true,
      color: { r: 0, g: 255, b: 255 },
      thickness: 1,
    });

    cv2.imwrite('output/pose_face_mesh.jpg', annotated.data);
    console.log('\nAnnotated image saved to: output/pose_face_mesh.jpg');
  } else {
    console.log('No face mesh detected in the image');
  }

  estimator.close();
}

// ============================================================================
// Demo 4: Full Pose (Body + Hands + Face)
// ============================================================================

async function demoFullPoseCombined() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 4: Combined Full Pose Detection');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator(
    {
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      smoothLandmarks: true,
    },
    {
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
    },
    {
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
    }
  );

  // Load test image
  const image = cv2.imread('examples/assets/full_pose.jpg');
  const [height, width] = image.shape.slice(0, 2);

  const imageData: ImageData = {
    data: image,
    width,
    height,
    channels: 3,
    dtype: 'uint8',
  };

  console.log(`Processing image: ${width}x${height}`);

  // Estimate full pose
  const pose = await estimator.estimateFullPose(imageData);

  if (pose) {
    console.log('\nFull pose detected!');
    console.log(`  Body confidence: ${pose.bodyConfidence.toFixed(3)}`);
    console.log(`  Body landmarks: 33`);

    if (pose.leftHand) {
      console.log(`  Left hand: detected (21 landmarks)`);
    }
    if (pose.rightHand) {
      console.log(`  Right hand: detected (21 landmarks)`);
    }
    if (pose.faceMesh) {
      console.log(`  Face mesh: detected (468 landmarks)`);
    }

    console.log(
      `  Total landmarks: ${33 + (pose.leftHand ? 21 : 0) + (pose.rightHand ? 21 : 0) + (pose.faceMesh ? 468 : 0)}`
    );

    // Draw full pose
    const annotated = estimator.drawPose(imageData, pose, {
      drawBody: true,
      drawHands: true,
      drawFace: true,
      thickness: 2,
    });

    cv2.imwrite('output/pose_full.jpg', annotated.data);
    console.log('\nAnnotated image saved to: output/pose_full.jpg');
  } else {
    console.log('No pose detected in the image');
  }

  estimator.close();
}

// ============================================================================
// Demo 5: Gesture Recognition
// ============================================================================

async function demoGestureRecognition() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 5: Gesture Recognition');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator(
    {},
    {
      maxNumHands: 2,
      minDetectionConfidence: 0.7,
    }
  );

  const gestures = [
    'thumbs_up',
    'open_palm',
    'fist',
    'peace',
    'pointing_up',
    'ok',
  ];

  console.log(`\nSupported gestures: ${gestures.join(', ')}`);

  for (const gestureName of gestures) {
    const imagePath = `examples/assets/gestures/${gestureName}.jpg`;
    try {
      const image = cv2.imread(imagePath);
      const [height, width] = image.shape.slice(0, 2);

      const imageData: ImageData = {
        data: image,
        width,
        height,
        channels: 3,
        dtype: 'uint8',
      };

      const pose = await estimator.estimateFullPose(imageData);

      if (pose) {
        const detected = estimator.detectGestures({
          left: pose.leftHand,
          right: pose.rightHand,
        });

        console.log(`\n${gestureName}:`);
        if (detected.length > 0) {
          for (const gesture of detected) {
            console.log(
              `  Detected: ${gesture.gesture} (${gesture.handedness} hand, confidence: ${gesture.confidence.toFixed(3)})`
            );
          }
        } else {
          console.log('  No gesture detected');
        }
      }
    } catch (e) {
      console.log(`  Image not found: ${imagePath}`);
    }
  }

  estimator.close();
}

// ============================================================================
// Demo 6: Activity Recognition
// ============================================================================

async function demoActivityRecognition() {
  console.log('\n' + '='.repeat(80));
  console.log('Demo 6: Activity Recognition from Video');
  console.log('='.repeat(80));

  const estimator = new PoseEstimator({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    smoothLandmarks: true,
    staticImageMode: false, // Enable tracking for video
  });

  // Open video
  const video = cv2.VideoCapture('examples/assets/activity.mp4');
  const fps = video.get(cv2.CAP_PROP_FPS);
  const frameCount = video.get(cv2.CAP_PROP_FRAME_COUNT);

  console.log(`\nProcessing video: ${frameCount} frames @ ${fps} FPS`);

  let processedFrames = 0;
  let currentActivity: string | null = null;

  while (true) {
    const [ret, frame] = video.read();
    if (!ret) break;

    const [height, width] = frame.shape.slice(0, 2);
    const imageData: ImageData = {
      data: frame,
      width,
      height,
      channels: 3,
      dtype: 'uint8',
    };

    // Process frame
    const pose = await estimator.estimateFullPose(imageData);
    processedFrames++;

    // Check for activity every 10 frames
    if (processedFrames % 10 === 0) {
      const activity = estimator.recognizeActivity();
      if (activity && activity.activity !== currentActivity) {
        currentActivity = activity.activity;
        console.log(
          `\nFrame ${processedFrames}: Activity detected - ${activity.activity} (confidence: ${activity.confidence.toFixed(3)})`
        );
      }
    }

    // Progress indicator
    if (processedFrames % 30 === 0) {
      const progress = ((processedFrames / frameCount) * 100).toFixed(1);
      process.stdout.write(`\rProgress: ${progress}%`);
    }
  }

  video.release();
  console.log(`\n\nProcessed ${processedFrames} frames`);
  console.log(`Tracking quality: ${estimator.getTrackingQuality().toFixed(3)}`);

  estimator.close();
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runAllDemos() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'POSE ESTIMATION DEMO' + ' '.repeat(38) + '║');
  console.log('║' + ' '.repeat(15) + 'Powered by MediaPipe via Elide' + ' '.repeat(33) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  try {
    // Create output directory
    try {
      cv2.mkdir('output');
    } catch (e) {
      // Directory already exists
    }

    // Run demos
    await demoFullBodyPose();
    await demoHandPose();
    await demoFaceMesh();
    await demoFullPoseCombined();
    await demoGestureRecognition();
    await demoActivityRecognition();

    console.log('\n' + '='.repeat(80));
    console.log('All demos completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\nError running demos:', error);
    process.exit(1);
  }
}

// Run demos if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos();
}

export {
  demoFullBodyPose,
  demoHandPose,
  demoFaceMesh,
  demoFullPoseCombined,
  demoGestureRecognition,
  demoActivityRecognition,
};
