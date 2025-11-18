/**
 * Buffer Pool and Memory Manager Tests
 *
 * Tests for zero-copy buffer management
 *
 * @module tests/buffer-test
 */

import { BufferPool } from '../shared/buffer-pool';
import { MemoryManager } from '../shared/memory-manager';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

/**
 * Test: Buffer Pool Acquisition
 */
async function testBufferPoolAcquisition(): Promise<TestResult> {
  const start = Date.now();

  try {
    const bufferPool = BufferPool.getInstance();
    const size = 1024 * 1024; // 1MB

    const { id, buffer, reused } = bufferPool.acquire(size);

    const passed = buffer !== null && buffer.length >= size && id !== '';

    bufferPool.release(id);

    return {
      name: 'Buffer Pool Acquisition',
      passed,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Buffer Pool Acquisition',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Buffer Pool Reuse
 */
async function testBufferPoolReuse(): Promise<TestResult> {
  const start = Date.now();

  try {
    const bufferPool = BufferPool.getInstance();
    bufferPool.resetStats();
    const size = 1024 * 1024;

    // Acquire and release
    const { id: id1 } = bufferPool.acquire(size);
    bufferPool.release(id1);

    // Acquire again - should reuse
    const { id: id2, reused } = bufferPool.acquire(size);
    bufferPool.release(id2);

    const stats = bufferPool.getStats();

    return {
      name: 'Buffer Pool Reuse',
      passed: stats.hits > 0,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Buffer Pool Reuse',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Memory Manager Region Creation
 */
async function testMemoryManagerRegion(): Promise<TestResult> {
  const start = Date.now();

  try {
    const memoryManager = MemoryManager.getInstance();
    const size = 1024 * 1024;
    const data = Buffer.alloc(size);

    const region = memoryManager.createRegion(size, data);

    const passed = region !== null && region.id !== '' && region.size === size;

    memoryManager.releaseRegion(region.id);

    return {
      name: 'Memory Manager Region Creation',
      passed,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Memory Manager Region Creation',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Shared Memory Read/Write
 */
async function testSharedMemoryReadWrite(): Promise<TestResult> {
  const start = Date.now();

  try {
    const memoryManager = MemoryManager.getInstance();
    const size = 1024;
    const testData = Buffer.from('Hello, Zero-Copy World!');

    const region = memoryManager.createRegion(size, testData);

    // Read back
    const readData = memoryManager.readBuffer(region.id, 0, testData.length);

    const passed = readData !== null && readData.equals(testData);

    memoryManager.releaseRegion(region.id);

    return {
      name: 'Shared Memory Read/Write',
      passed,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Shared Memory Read/Write',
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test: Buffer Pool Stats
 */
async function testBufferPoolStats(): Promise<TestResult> {
  const start = Date.now();

  try {
    const bufferPool = BufferPool.getInstance();
    bufferPool.resetStats();

    // Acquire some buffers
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { id } = bufferPool.acquire(1024 * 1024);
      ids.push(id);
    }

    const stats = bufferPool.getStats();

    const passed =
      stats.totalBuffers >= 5 &&
      stats.buffersInUse === 5 &&
      stats.totalMemory > 0;

    // Release buffers
    for (const id of ids) {
      bufferPool.release(id);
    }

    return {
      name: 'Buffer Pool Stats',
      passed,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Buffer Pool Stats',
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
  console.log('║          Buffer Pool & Memory Manager Tests                 ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  const tests = [
    testBufferPoolAcquisition,
    testBufferPoolReuse,
    testMemoryManagerRegion,
    testSharedMemoryReadWrite,
    testBufferPoolStats,
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    process.stdout.write(`Running ${test.name}...`);
    const result = await test();
    results.push(result);
    console.log(` ${result.passed ? '✓' : '✗'} (${result.duration}ms)`);

    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
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

  // Cleanup
  BufferPool.getInstance().cleanup();
  MemoryManager.getInstance().cleanup();

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
