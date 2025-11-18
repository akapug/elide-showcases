/**
 * Computer Vision Tests
 *
 * Tests for CV operations including face detection, object tracking,
 * filters, and transformations.
 *
 * @module tests/cv-test
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  data?: any;
}

/**
 * Create test image buffer
 */
function createTestImage(): Buffer {
  // Create a simple test image (100x100 RGB)
  const width = 100;
  const height = 100;
  const buffer = Buffer.alloc(width * height * 3);

  // Fill with gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      buffer[idx] = x * 2; // R
      buffer[idx + 1] = y * 2; // G
      buffer[idx + 2] = 128; // B
    }
  }

  return buffer;
}

/**
 * Execute Python processor
 */
async function executePython(
  script: string,
  args: string[],
  input?: Buffer
): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [script, ...args], {
      cwd: join(__dirname, '..'),
    });

    let stdout = '';
    let stderr = '';

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

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
 * Test: Face Detection
 */
async function testFaceDetection(): Promise<TestResult> {
  const start = Date.now();

  try {
    const testImage = createTestImage();

    // Note: This will not detect faces in our test gradient, but tests the pipeline
    const result = await executePython(
      join(__dirname, '../cv/opencv_processor.py'),
      ['detect-faces', 'png'],
      testImage
    );

    const duration = Date.now() - start;

    if (result.error) {
      return {
        name: 'Face Detection',
        passed: false,
        duration,
        error: result.error,
      };
    }

    return {
      name: 'Face Detection',
      passed: true,
      duration,
      data: {
        faces: result.faces?.length || 0,
        width: result.width,
        height: result.height,
        processingTime: result.processingTime,
      },
    };
  } catch (error) {
    return {
      name: 'Face Detection',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Object Tracking
 */
async function testObjectTracking(): Promise<TestResult> {
  const start = Date.now();

  try {
    const testImage = createTestImage();

    const result = await executePython(
      join(__dirname, '../cv/opencv_processor.py'),
      ['track-objects', 'png', 'all'],
      testImage
    );

    const duration = Date.now() - start;

    if (result.error) {
      return {
        name: 'Object Tracking',
        passed: false,
        duration,
        error: result.error,
      };
    }

    return {
      name: 'Object Tracking',
      passed: true,
      duration,
      data: {
        objects: result.objects?.length || 0,
        totalObjects: result.totalObjects,
        processingTime: result.processingTime,
      },
    };
  } catch (error) {
    return {
      name: 'Object Tracking',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Filter Application
 */
async function testFilterApplication(): Promise<TestResult> {
  const start = Date.now();

  try {
    const testImage = createTestImage();

    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      ['filter', 'png', 'blur', '1.0'],
      testImage
    );

    const duration = Date.now() - start;

    if (result.error) {
      return {
        name: 'Filter Application (Blur)',
        passed: false,
        duration,
        error: result.error,
      };
    }

    return {
      name: 'Filter Application (Blur)',
      passed: result.imageData !== undefined,
      duration,
      data: {
        outputSize: result.size,
        processingTime: result.processingTime,
        bufferReused: result.bufferReused,
      },
    };
  } catch (error) {
    return {
      name: 'Filter Application (Blur)',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Image Resize
 */
async function testResize(): Promise<TestResult> {
  const start = Date.now();

  try {
    const testImage = createTestImage();

    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      ['resize', 'png', '50', '50'],
      testImage
    );

    const duration = Date.now() - start;

    if (result.error) {
      return {
        name: 'Image Resize',
        passed: false,
        duration,
        error: result.error,
      };
    }

    return {
      name: 'Image Resize',
      passed: result.width === 50 && result.height === 50,
      duration,
      data: {
        width: result.width,
        height: result.height,
        processingTime: result.processingTime,
      },
    };
  } catch (error) {
    return {
      name: 'Image Resize',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Image Rotate
 */
async function testRotate(): Promise<TestResult> {
  const start = Date.now();

  try {
    const testImage = createTestImage();

    const result = await executePython(
      join(__dirname, '../cv/pillow_processor.py'),
      ['rotate', 'png', '90'],
      testImage
    );

    const duration = Date.now() - start;

    if (result.error) {
      return {
        name: 'Image Rotate',
        passed: false,
        duration,
        error: result.error,
      };
    }

    return {
      name: 'Image Rotate',
      passed: result.imageData !== undefined,
      duration,
      data: {
        width: result.width,
        height: result.height,
        processingTime: result.processingTime,
      },
    };
  } catch (error) {
    return {
      name: 'Image Rotate',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║        Computer Vision Pipeline - Test Suite                ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  const tests = [
    testFaceDetection,
    testObjectTracking,
    testFilterApplication,
    testResize,
    testRotate,
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    process.stdout.write(`Running ${test.name}...`);
    const result = await test();
    results.push(result);
    console.log(` ${result.passed ? '✓' : '✗'} (${result.duration}ms)`);

    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    } else if (result.data) {
      console.log(`  Data:`, result.data);
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║                       Test Summary                           ║');
  console.log('╠═════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests:  ${results.length.toString().padEnd(45)} ║`);
  console.log(`║  Passed:       ${passed.toString().padEnd(45)} ║`);
  console.log(`║  Failed:       ${failed.toString().padEnd(45)} ║`);
  console.log(`║  Success Rate: ${((passed / results.length) * 100).toFixed(2)}%`.padEnd(63) + '║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
