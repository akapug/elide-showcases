/**
 * Basic Effects Example
 *
 * Demonstrates fundamental video effects and filters.
 */

import { VideoProcessor } from '../src/server';
import { FilterEngine } from '../src/effects/filter-engine';
import { FaceDetector } from '../src/effects/face-detection';
import { ObjectTracker } from '../src/effects/object-tracking';

/**
 * Example 1: Basic Color Filters
 */
async function example1_colorFilters() {
  console.log('\n=== Example 1: Basic Color Filters ===\n');

  const processor = new VideoProcessor({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high'
  });

  try {
    await processor.start();

    // Apply brightness and contrast
    processor.applyEffect('filter', {
      filterType: 'brightness-contrast',
      brightness: 20,
      contrast: 1.3
    });

    console.log('✓ Brightness/Contrast filter applied');

    // Apply color grading
    processor.applyEffect('filter', {
      filterType: 'color-grade',
      preset: 'cinematic-warm',
      intensity: 0.7
    });

    console.log('✓ Color grading applied');

    // Get statistics
    const stats = processor.getStats();
    console.log('\nProcessor Statistics:');
    console.log(`- Frames Processed: ${stats.framesProcessed}`);
    console.log(`- Average FPS: ${stats.averageFps.toFixed(2)}`);
    console.log(`- Average Latency: ${stats.averageLatency.toFixed(2)}ms`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await processor.stop();
    console.log('\n✓ Processor stopped\n');
  }
}

/**
 * Example 2: Blur and Sharpen Effects
 */
async function example2_blurSharpen() {
  console.log('\n=== Example 2: Blur and Sharpen Effects ===\n');

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080,
    quality: 'high'
  });

  // Simulate a frame (in real use, this would come from video source)
  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  try {
    // Apply Gaussian blur
    console.log('Applying Gaussian blur...');
    await filterEngine.apply(mockFrame, {
      filterType: 'gaussian-blur',
      kernelSize: 15,
      sigma: 3
    });
    console.log('✓ Gaussian blur applied');

    // Apply sharpen filter
    console.log('Applying sharpen filter...');
    await filterEngine.apply(mockFrame, {
      filterType: 'sharpen',
      amount: 1.0
    });
    console.log('✓ Sharpen filter applied');

    // Apply edge detection
    console.log('Applying edge detection...');
    await filterEngine.apply(mockFrame, {
      filterType: 'edge-detection',
      method: 'canny',
      threshold1: 50,
      threshold2: 150
    });
    console.log('✓ Edge detection applied');

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n✓ Blur/Sharpen examples completed\n');
}

/**
 * Example 3: Artistic Effects
 */
async function example3_artisticEffects() {
  console.log('\n=== Example 3: Artistic Effects ===\n');

  const filterEngine = new FilterEngine({
    width: 1920,
    height: 1080,
    quality: 'high'
  });

  const mockFrame = {
    data: Buffer.alloc(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    format: 'rgb24'
  };

  try {
    // Cartoon effect
    console.log('Applying cartoon effect...');
    await filterEngine.apply(mockFrame, {
      filterType: 'cartoon',
      edgeThickness: 2,
      colorReduction: 8
    });
    console.log('✓ Cartoon effect applied');

    // Oil painting effect
    console.log('Applying oil painting effect...');
    await filterEngine.apply(mockFrame, {
      filterType: 'oil-painting',
      radius: 5,
      levels: 20
    });
    console.log('✓ Oil painting effect applied');

    // Posterize effect
    console.log('Applying posterize effect...');
    await filterEngine.apply(mockFrame, {
      filterType: 'posterize',
      levels: 4
    });
    console.log('✓ Posterize effect applied');

  } catch (error) {
    console.error('Error:', error);
  }

  console.log('\n✓ Artistic effects examples completed\n');
}

/**
 * Example 4: Face Detection
 */
async function example4_faceDetection() {
  console.log('\n=== Example 4: Face Detection ===\n');

  const faceDetector = new FaceDetector({
    minConfidence: 0.7,
    detectLandmarks: true,
    detectEmotion: true,
    trackFaces: true
  });

  try {
    await faceDetector.initialize();
    console.log('✓ Face detector initialized');

    const mockFrame = {
      data: Buffer.alloc(1920 * 1080 * 4),
      width: 1920,
      height: 1080,
      timestamp: Date.now(),
      format: 'rgb24'
    };

    // Detect faces
    console.log('Detecting faces...');
    const result = await faceDetector.detect(mockFrame, {
      drawBoundingBox: true,
      drawLandmarks: true,
      showEmotion: true
    });
    console.log('✓ Face detection completed');

    // Apply beautify filter
    console.log('Applying beautify filter...');
    await faceDetector.applyFilter('beautify', {
      smoothing: 0.7,
      sharpen: 0.3
    });
    console.log('✓ Beautify filter applied');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    faceDetector.destroy();
    console.log('\n✓ Face detector destroyed\n');
  }
}

/**
 * Example 5: Object Tracking
 */
async function example5_objectTracking() {
  console.log('\n=== Example 5: Object Tracking ===\n');

  const tracker = new ObjectTracker({
    algorithm: 'kcf',
    maxObjects: 10,
    trackingQuality: 'high',
    enableMotionPrediction: true
  });

  try {
    const mockFrame = {
      data: Buffer.alloc(1920 * 1080 * 4),
      width: 1920,
      height: 1080,
      timestamp: Date.now(),
      format: 'rgb24'
    };

    // Initialize tracker with bounding box
    console.log('Initializing tracker...');
    const objectId = tracker.initTracker(mockFrame, {
      x: 100,
      y: 100,
      width: 200,
      height: 200
    }, 'person');
    console.log(`✓ Tracker initialized with ID: ${objectId}`);

    // Track object in next frame
    console.log('Tracking object...');
    await tracker.track(mockFrame, {
      drawTracking: true,
      showTrails: true,
      showVelocity: true,
      showPrediction: true
    });
    console.log('✓ Object tracking completed');

    // Get tracked objects
    const trackedObjects = tracker.getTrackedObjects();
    console.log(`\nTracked objects: ${trackedObjects.length}`);

    for (const obj of trackedObjects) {
      console.log(`- Object ${obj.id}: ${obj.label} (${obj.state})`);
      console.log(`  Position: (${obj.bbox.x}, ${obj.bbox.y})`);
      console.log(`  Size: ${obj.bbox.width}x${obj.bbox.height}`);
      if (obj.velocity) {
        console.log(`  Velocity: (${obj.velocity.x.toFixed(2)}, ${obj.velocity.y.toFixed(2)})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    tracker.clearTrackers();
    console.log('\n✓ Trackers cleared\n');
  }
}

/**
 * Example 6: Effect Chaining
 */
async function example6_effectChaining() {
  console.log('\n=== Example 6: Effect Chaining ===\n');

  const processor = new VideoProcessor({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high'
  });

  try {
    await processor.start();

    // Chain multiple effects
    processor.chainEffects([
      {
        name: 'filter',
        params: {
          filterType: 'brightness-contrast',
          brightness: 10,
          contrast: 1.2
        },
        priority: 1
      },
      {
        name: 'filter',
        params: {
          filterType: 'color-grade',
          preset: 'cinematic-warm',
          intensity: 0.8
        },
        priority: 2
      },
      {
        name: 'filter',
        params: {
          filterType: 'vignette',
          intensity: 0.5,
          radius: 0.8
        },
        priority: 3
      },
      {
        name: 'filter',
        params: {
          filterType: 'grain',
          intensity: 0.1
        },
        priority: 4
      }
    ]);

    console.log('✓ Effect chain configured');
    console.log('\nEffect chain:');
    console.log('1. Brightness/Contrast adjustment');
    console.log('2. Cinematic warm color grading');
    console.log('3. Vignette effect');
    console.log('4. Film grain');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await processor.stop();
    console.log('\n✓ Processor stopped\n');
  }
}

/**
 * Example 7: Performance Monitoring
 */
async function example7_performanceMonitoring() {
  console.log('\n=== Example 7: Performance Monitoring ===\n');

  const processor = new VideoProcessor({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high'
  });

  try {
    await processor.start();

    // Set up event listeners
    processor.on('frame-processed', (frame) => {
      // Frame processed
    });

    processor.on('stats-updated', (stats) => {
      console.log('\nStats Update:');
      console.log(`- Frames Processed: ${stats.framesProcessed}`);
      console.log(`- Average FPS: ${stats.averageFps.toFixed(2)}`);
      console.log(`- Average Latency: ${stats.averageLatency.toFixed(2)}ms`);
      console.log(`- Dropped Frames: ${stats.droppedFrames}`);
      console.log(`- Memory Usage: ${stats.memoryUsage.toFixed(2)} MB`);
    });

    processor.on('error', (error) => {
      console.error('Processing error:', error);
    });

    // Apply some effects to generate load
    processor.applyEffect('filter', {
      filterType: 'gaussian-blur',
      kernelSize: 15
    });

    console.log('✓ Performance monitoring configured');

    // Simulate processing for a few seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await processor.stop();
    console.log('\n✓ Performance monitoring stopped\n');
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Video AI Effects Platform Examples   ║');
  console.log('║        Basic Effects & Filters         ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await example1_colorFilters();
    await example2_blurSharpen();
    await example3_artisticEffects();
    await example4_faceDetection();
    await example5_objectTracking();
    await example6_effectChaining();
    await example7_performanceMonitoring();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   All Examples Completed Successfully  ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  example1_colorFilters,
  example2_blurSharpen,
  example3_artisticEffects,
  example4_faceDetection,
  example5_objectTracking,
  example6_effectChaining,
  example7_performanceMonitoring
};
