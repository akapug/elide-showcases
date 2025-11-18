/**
 * Video Processing Example
 *
 * Demonstrates real-time video frame processing at 30 FPS
 *
 * @module examples/video-processing
 */

import { BufferPool } from '../shared/buffer-pool';
import { randomBytes } from 'crypto';

/**
 * Simulate video frame processing
 */
async function processVideoFrame(
  frameBuffer: Buffer,
  frameIndex: number,
  operation: string
): Promise<{ processingTime: number; result: any }> {
  const start = Date.now();

  // Simulate CV operation
  await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

  const processingTime = Date.now() - start;

  return {
    processingTime,
    result: {
      frameIndex,
      operation,
      objects: Math.floor(Math.random() * 10),
    },
  };
}

/**
 * Example: Real-time Video Processing
 */
async function exampleVideoProcessing() {
  console.log('\n--- Real-time Video Processing (30 FPS) ---');

  const bufferPool = BufferPool.getInstance();
  bufferPool.resetStats();

  const width = 1920;
  const height = 1080;
  const frameSize = width * height * 3; // RGB
  const targetFps = 30;
  const targetFrameTime = 1000 / targetFps;
  const totalFrames = 300; // 10 seconds

  const frameTimes: number[] = [];
  let droppedFrames = 0;
  const results: any[] = [];

  console.log(`Resolution: ${width}x${height}`);
  console.log(`Target FPS: ${targetFps}`);
  console.log(`Total Frames: ${totalFrames}\n`);

  for (let i = 0; i < totalFrames; i++) {
    const frameStart = Date.now();

    // Acquire buffer for frame
    const { id, buffer, reused } = bufferPool.acquire(frameSize);

    // Simulate frame data
    const frameData = randomBytes(Math.min(frameSize, 1000));
    frameData.copy(buffer, 0);

    // Process frame
    const { processingTime, result } = await processVideoFrame(
      buffer,
      i,
      'detect-faces'
    );

    // Release buffer
    bufferPool.release(id);

    const totalFrameTime = Date.now() - frameStart;
    frameTimes.push(totalFrameTime);

    if (totalFrameTime > targetFrameTime) {
      droppedFrames++;
    }

    results.push(result);

    // Progress indicator
    if ((i + 1) % 30 === 0) {
      process.stdout.write(`\r  Processed: ${i + 1}/${totalFrames} frames`);
    }
  }

  console.log(''); // New line

  const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const actualFps = 1000 / avgFrameTime;

  console.log(`\nResults:`);
  console.log(`  Avg Frame Time: ${avgFrameTime.toFixed(2)}ms`);
  console.log(`  Actual FPS: ${actualFps.toFixed(2)}`);
  console.log(`  Target FPS: ${targetFps}`);
  console.log(`  Dropped Frames: ${droppedFrames} (${((droppedFrames / totalFrames) * 100).toFixed(2)}%)`);
  console.log(`  Can Maintain 30 FPS: ${droppedFrames === 0 ? 'Yes ✓' : 'No ✗'}`);

  const stats = bufferPool.getStats();
  console.log(`\nBuffer Pool:`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  Total Buffers: ${stats.totalBuffers}`);
  console.log(`  Memory Used: ${(stats.usedMemory / 1024 / 1024).toFixed(2)}MB`);
}

/**
 * Example: Multi-resolution Video Processing
 */
async function exampleMultiResolution() {
  console.log('\n--- Multi-Resolution Processing ---');

  const resolutions = [
    { name: '720p', width: 1280, height: 720 },
    { name: '1080p', width: 1920, height: 1080 },
    { name: '4K', width: 3840, height: 2160 },
  ];

  const bufferPool = BufferPool.getInstance();
  const framesPerResolution = 30;

  for (const res of resolutions) {
    bufferPool.resetStats();

    const frameSize = res.width * res.height * 3;
    const frameTimes: number[] = [];

    for (let i = 0; i < framesPerResolution; i++) {
      const start = Date.now();

      const { id, buffer } = bufferPool.acquire(frameSize);

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10));

      bufferPool.release(id);

      frameTimes.push(Date.now() - start);
    }

    const avgTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgTime;

    console.log(`\n${res.name} (${res.width}x${res.height}):`);
    console.log(`  Avg Frame Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Max FPS: ${fps.toFixed(2)}`);
    console.log(`  Can do 30 FPS: ${fps >= 30 ? 'Yes ✓' : 'No ✗'}`);
  }
}

/**
 * Example: Frame Analysis Pipeline
 */
async function exampleFrameAnalysisPipeline() {
  console.log('\n--- Frame Analysis Pipeline ---');

  const bufferPool = BufferPool.getInstance();
  const frameCount = 60; // 2 seconds at 30 FPS
  const frameSize = 1920 * 1080 * 3;

  const pipeline = [
    { name: 'Face Detection', time: 15 },
    { name: 'Object Tracking', time: 20 },
    { name: 'Edge Detection', time: 10 },
  ];

  console.log(`Pipeline stages: ${pipeline.map(p => p.name).join(' → ')}`);
  console.log(`Processing ${frameCount} frames...\n`);

  const stageTimes: { [key: string]: number[] } = {};
  for (const stage of pipeline) {
    stageTimes[stage.name] = [];
  }

  for (let i = 0; i < frameCount; i++) {
    const { id, buffer } = bufferPool.acquire(frameSize);

    // Process through pipeline
    for (const stage of pipeline) {
      const start = Date.now();

      // Simulate stage processing
      await new Promise(resolve => setTimeout(resolve, stage.time + Math.random() * 5));

      stageTimes[stage.name].push(Date.now() - start);
    }

    bufferPool.release(id);

    if ((i + 1) % 30 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${frameCount}`);
    }
  }

  console.log(''); // New line

  console.log(`\nPipeline Performance:`);
  for (const stage of pipeline) {
    const times = stageTimes[stage.name];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    console.log(`\n${stage.name}:`);
    console.log(`  Avg: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }

  const totalAvg = pipeline.reduce((sum, stage) => {
    const avg = stageTimes[stage.name].reduce((a, b) => a + b, 0) / stageTimes[stage.name].length;
    return sum + avg;
  }, 0);

  const maxFps = 1000 / totalAvg;

  console.log(`\nTotal Pipeline:`);
  console.log(`  Avg Time: ${totalAvg.toFixed(2)}ms`);
  console.log(`  Max FPS: ${maxFps.toFixed(2)}`);
}

/**
 * Main
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║           Video Processing Examples                         ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  try {
    await exampleVideoProcessing();
    await exampleMultiResolution();
    await exampleFrameAnalysisPipeline();

    console.log('\n✓ All examples completed successfully\n');

    // Cleanup
    BufferPool.getInstance().cleanup();
  } catch (error) {
    console.error('\n✗ Example failed:', error);
    process.exit(1);
  }
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to run examples:', error);
    process.exit(1);
  });
}
