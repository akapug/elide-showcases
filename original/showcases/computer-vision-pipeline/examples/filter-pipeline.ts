/**
 * Filter Pipeline Example
 *
 * Demonstrates chaining multiple filters and transformations
 *
 * @module examples/filter-pipeline
 */

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
  const size = width * height * 3;
  const buffer = Buffer.alloc(size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      buffer[idx] = (x / width) * 255;
      buffer[idx + 1] = (y / height) * 255;
      buffer[idx + 2] = ((x + y) / (width + height)) * 255;
    }
  }

  return buffer;
}

/**
 * Example: Single Filter
 */
async function exampleSingleFilter() {
  console.log('\n--- Single Filter Application ---');

  const testImage = createTestImage(800, 600);

  const filters = [
    { name: 'Blur', filter: 'blur', intensity: 1.0 },
    { name: 'Sharpen', filter: 'sharpen', intensity: 1.0 },
    { name: 'Edge Enhance', filter: 'edge-enhance', intensity: 1.0 },
    { name: 'Emboss', filter: 'emboss', intensity: 1.0 },
  ];

  console.log(`Original Image: 800x600\n`);

  for (const { name, filter, intensity } of filters) {
    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      ['filter', 'png', filter, intensity.toString()],
      testImage
    );

    console.log(`${name}:`);
    console.log(`  Processing Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Output Size: ${(result.size / 1024).toFixed(2)}KB`);
  }
}

/**
 * Example: Filter Chain
 */
async function exampleFilterChain() {
  console.log('\n--- Filter Chain Pipeline ---');

  let currentImage = createTestImage(1024, 768);

  const pipeline = [
    { operation: 'filter', args: ['png', 'blur', '0.5'], name: 'Blur (50%)' },
    { operation: 'filter', args: ['png', 'sharpen', '0.7'], name: 'Sharpen (70%)' },
    { operation: 'filter', args: ['png', 'edge-enhance', '0.3'], name: 'Edge Enhance (30%)' },
  ];

  console.log(`Pipeline: ${pipeline.map(p => p.name).join(' → ')}\n`);

  let totalTime = 0;

  for (const stage of pipeline) {
    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      stage.args,
      currentImage
    );

    console.log(`${stage.name}:`);
    console.log(`  Processing Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Output Size: ${result.width}x${result.height}`);

    totalTime += result.processingTime;

    // Use output as input for next stage
    currentImage = Buffer.from(result.imageData, 'base64');
  }

  console.log(`\nTotal Pipeline Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Avg per Stage: ${(totalTime / pipeline.length).toFixed(2)}ms`);
}

/**
 * Example: Transform Chain
 */
async function exampleTransformChain() {
  console.log('\n--- Transform Chain Pipeline ---');

  let currentImage = createTestImage(1920, 1080);

  const pipeline = [
    { operation: 'resize', args: ['png', '1280', '720'], name: 'Resize to 720p' },
    { operation: 'rotate', args: ['png', '15'], name: 'Rotate 15°' },
    { operation: 'crop', args: ['png', '100', '100', '800', '400'], name: 'Crop Center' },
  ];

  console.log(`Original: 1920x1080`);
  console.log(`Pipeline: ${pipeline.map(p => p.name).join(' → ')}\n`);

  let totalTime = 0;

  for (const stage of pipeline) {
    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      stage.args,
      currentImage
    );

    console.log(`${stage.name}:`);
    console.log(`  Processing Time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Output Size: ${result.width}x${result.height}`);

    totalTime += result.processingTime;
    currentImage = Buffer.from(result.imageData, 'base64');
  }

  console.log(`\nTotal Pipeline Time: ${totalTime.toFixed(2)}ms`);
}

/**
 * Example: Parallel Filter Processing
 */
async function exampleParallelFilters() {
  console.log('\n--- Parallel Filter Processing ---');

  const testImage = createTestImage(800, 600);

  const filters = [
    { name: 'Blur', filter: 'blur' },
    { name: 'Sharpen', filter: 'sharpen' },
    { name: 'Edge Enhance', filter: 'edge-enhance' },
    { name: 'Smooth', filter: 'smooth' },
    { name: 'Emboss', filter: 'emboss' },
    { name: 'Contour', filter: 'contour' },
  ];

  console.log(`Processing ${filters.length} filters in parallel...\n`);

  const start = Date.now();

  const results = await Promise.all(
    filters.map(({ name, filter }) =>
      executePython(
        join(__dirname, '../cv/pillow_processor.py'),
        ['filter', 'png', filter, '1.0'],
        testImage
      ).then(result => ({ name, result }))
    )
  );

  const totalTime = Date.now() - start;

  console.log(`Results:`);
  for (const { name, result } of results) {
    console.log(`  ${name}: ${result.processingTime.toFixed(2)}ms`);
  }

  const sequentialTime = results.reduce((sum, { result }) => sum + result.processingTime, 0);

  console.log(`\nParallel Time: ${totalTime}ms`);
  console.log(`Sequential Time: ${sequentialTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(sequentialTime / totalTime).toFixed(2)}x`);
}

/**
 * Main
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║           Filter Pipeline Examples                          ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  try {
    await exampleSingleFilter();
    await exampleFilterChain();
    await exampleTransformChain();
    await exampleParallelFilters();

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
