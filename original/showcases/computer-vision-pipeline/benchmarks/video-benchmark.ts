/**
 * Video Processing Benchmark
 *
 * Benchmarks real-time video frame processing at various FPS targets
 *
 * @module benchmarks/video-benchmark
 */

import { BufferPool } from '../shared/buffer-pool';
import { randomBytes } from 'crypto';

/**
 * Simulate video frame processing
 */
async function processVideoFrames(
  frameCount: number,
  targetFps: number,
  width: number,
  height: number
): Promise<{ avgFrameTime: number; actualFps: number; droppedFrames: number }> {
  const bufferPool = BufferPool.getInstance();
  const frameSize = width * height * 3; // RGB
  const targetFrameTime = 1000 / targetFps;

  let totalFrameTime = 0;
  let droppedFrames = 0;

  console.log(`Processing ${frameCount} frames at ${targetFps} FPS (${width}x${height})...`);

  for (let i = 0; i < frameCount; i++) {
    const frameStart = Date.now();

    // Acquire buffer
    const { id, buffer } = bufferPool.acquire(frameSize);

    // Simulate frame processing
    const frameData = randomBytes(Math.min(frameSize, 1000)); // Partial frame data for speed
    frameData.copy(buffer, 0);

    // Simulate CV processing time (5-15ms)
    const processingTime = 5 + Math.random() * 10;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Release buffer
    bufferPool.release(id);

    const frameTime = Date.now() - frameStart;
    totalFrameTime += frameTime;

    // Check if we can keep up with target FPS
    if (frameTime > targetFrameTime) {
      droppedFrames++;
    }

    if ((i + 1) % 30 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${frameCount} frames`);
    }
  }

  console.log(''); // New line

  const avgFrameTime = totalFrameTime / frameCount;
  const actualFps = 1000 / avgFrameTime;

  return { avgFrameTime, actualFps, droppedFrames };
}

/**
 * Main benchmark
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║          Video Processing Benchmark (30 FPS)                 ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  const configurations = [
    { name: '720p', width: 1280, height: 720, fps: 30 },
    { name: '1080p', width: 1920, height: 1080, fps: 30 },
    { name: '4K', width: 3840, height: 2160, fps: 30 },
  ];

  const frameCount = 300; // 10 seconds at 30 FPS

  console.log(`Test Configuration:`);
  console.log(`  Frame Count: ${frameCount}`);
  console.log(`  Target FPS:  30\n`);

  for (const config of configurations) {
    console.log(`\n--- ${config.name} (${config.width}x${config.height}) ---`);

    const result = await processVideoFrames(
      frameCount,
      config.fps,
      config.width,
      config.height
    );

    console.log(`\nResults:`);
    console.log(`  Avg Frame Time:  ${result.avgFrameTime.toFixed(2)}ms`);
    console.log(`  Actual FPS:      ${result.actualFps.toFixed(2)}`);
    console.log(`  Dropped Frames:  ${result.droppedFrames} (${((result.droppedFrames / frameCount) * 100).toFixed(2)}%)`);
    console.log(`  Can Maintain:    ${result.droppedFrames === 0 ? '✓ Yes' : '✗ No'}`);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Show buffer pool stats
  const stats = BufferPool.getInstance().getStats();
  console.log(`\n--- Buffer Pool Statistics ---`);
  console.log(`  Hit Rate:        ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  Total Buffers:   ${stats.totalBuffers}`);
  console.log(`  Memory Used:     ${(stats.usedMemory / 1024 / 1024).toFixed(2)}MB`);

  console.log('\n✓ Video benchmark complete\n');

  // Cleanup
  BufferPool.getInstance().cleanup();
}

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}
