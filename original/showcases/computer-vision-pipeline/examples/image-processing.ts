/**
 * Image Processing Example
 *
 * Demonstrates various image processing operations using zero-copy buffers
 *
 * @module examples/image-processing
 */

import { randomBytes } from 'crypto';
import { spawn } from 'child_process';
import { join } from 'path';
import { BufferPool } from '../shared/buffer-pool';

/**
 * Execute Python processor
 */
async function executePython(script: string, args: string[], input: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [script, ...args], {
      cwd: join(__dirname, '..'),
    });

    let stdout = '';
    let stderr = '';

    proc.stdin.write(input);
    proc.stdin.end();

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(new Error(`Failed to parse output: ${error}`));
        }
      } else {
        reject(new Error(`Process failed: ${stderr}`));
      }
    });
  });
}

/**
 * Create test image
 */
function createTestImage(width: number, height: number): Buffer {
  const size = width * height * 3; // RGB
  const buffer = Buffer.alloc(size);

  // Create gradient pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      buffer[idx] = (x / width) * 255; // R
      buffer[idx + 1] = (y / height) * 255; // G
      buffer[idx + 2] = 128; // B
    }
  }

  return buffer;
}

/**
 * Example: Face Detection
 */
async function exampleFaceDetection() {
  console.log('\n--- Face Detection Example ---');

  const testImage = createTestImage(640, 480);

  const result = await executePython(
    join(__dirname, '../cv/opencv_processor.py'),
    ['detect-faces', 'png'],
    testImage
  );

  console.log(`Detected ${result.totalFaces} face(s)`);
  console.log(`Processing Time: ${result.processingTime.toFixed(2)}ms`);
  console.log(`Image Size: ${result.width}x${result.height}`);
  console.log(`Buffer Reused: ${result.bufferReused ? 'Yes' : 'No'}`);

  if (result.faces && result.faces.length > 0) {
    console.log(`\nFirst Face:`);
    console.log(`  Position: (${result.faces[0].bbox.x}, ${result.faces[0].bbox.y})`);
    console.log(`  Size: ${result.faces[0].bbox.width}x${result.faces[0].bbox.height}`);
    console.log(`  Eyes: ${result.faces[0].eyes}`);
  }
}

/**
 * Example: Apply Filter
 */
async function exampleApplyFilter() {
  console.log('\n--- Apply Filter Example ---');

  const testImage = createTestImage(800, 600);

  const filters = ['blur', 'sharpen', 'edge-enhance'];

  for (const filter of filters) {
    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      ['filter', 'png', filter, '1.0'],
      testImage
    );

    console.log(`\nFilter: ${filter}`);
    console.log(`  Processing Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Output Size: ${(result.size / 1024).toFixed(2)}KB`);
    console.log(`  Buffer Reused: ${result.bufferReused ? 'Yes' : 'No'}`);
  }
}

/**
 * Example: Image Transformations
 */
async function exampleTransformations() {
  console.log('\n--- Image Transformations Example ---');

  const testImage = createTestImage(1024, 768);

  // Resize
  const resizeResult = await executePython(
    join(__dirname, '../cv/pillow_processor.py'),
    ['resize', 'png', '512', '384'],
    testImage
  );

  console.log(`\nResize:`);
  console.log(`  Original: 1024x768`);
  console.log(`  Resized: ${resizeResult.width}x${resizeResult.height}`);
  console.log(`  Processing Time: ${resizeResult.processingTime.toFixed(2)}ms`);

  // Rotate
  const rotateResult = await executePython(
    join(__dirname, '../cv/pillow_processor.py'),
    ['rotate', 'png', '45'],
    testImage
  );

  console.log(`\nRotate 45°:`);
  console.log(`  Output Size: ${rotateResult.width}x${rotateResult.height}`);
  console.log(`  Processing Time: ${rotateResult.processingTime.toFixed(2)}ms`);

  // Crop
  const cropResult = await executePython(
    join(__dirname, '../cv/pillow_processor.py'),
    ['crop', 'png', '100', '100', '400', '300'],
    testImage
  );

  console.log(`\nCrop:`);
  console.log(`  Crop Box: (100, 100) to (500, 400)`);
  console.log(`  Output Size: ${cropResult.width}x${cropResult.height}`);
  console.log(`  Processing Time: ${cropResult.processingTime.toFixed(2)}ms`);
}

/**
 * Example: Buffer Pool Usage
 */
async function exampleBufferPool() {
  console.log('\n--- Buffer Pool Usage Example ---');

  const bufferPool = BufferPool.getInstance();
  bufferPool.resetStats();

  // Process multiple images using buffer pool
  const imageCount = 10;
  const imageSize = 1920 * 1080 * 3; // 1080p

  console.log(`Processing ${imageCount} images with buffer pool...`);

  for (let i = 0; i < imageCount; i++) {
    const { id, buffer, reused } = bufferPool.acquire(imageSize);

    // Simulate processing
    const testData = randomBytes(Math.min(imageSize, 1000));
    testData.copy(buffer, 0);

    bufferPool.release(id);
  }

  const stats = bufferPool.getStats();

  console.log(`\nBuffer Pool Statistics:`);
  console.log(`  Total Buffers: ${stats.totalBuffers}`);
  console.log(`  Available: ${stats.availableBuffers}`);
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  Total Memory: ${(stats.totalMemory / 1024 / 1024).toFixed(2)}MB`);
}

/**
 * Main
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║           Image Processing Examples                         ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  try {
    await exampleFaceDetection();
    await exampleApplyFilter();
    await exampleTransformations();
    await exampleBufferPool();

    console.log('\n✓ All examples completed successfully\n');
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
