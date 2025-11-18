/**
 * Memory Comparison Benchmark
 *
 * Compares memory usage between different buffer management approaches:
 * - Zero-copy buffer pool
 * - Traditional allocation
 * - Shared memory regions
 *
 * @module benchmarks/memory-comparison
 */

import { BufferPool } from '../shared/buffer-pool';
import { MemoryManager } from '../shared/memory-manager';
import { randomBytes } from 'crypto';

interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

/**
 * Take memory snapshot
 */
function takeSnapshot(): MemorySnapshot {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    rss: mem.rss,
    timestamp: Date.now(),
  };
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

/**
 * Test buffer pool memory usage
 */
async function testBufferPool(imageCount: number, imageSize: number) {
  console.log('\n=== Buffer Pool Memory Test ===');

  const bufferPool = BufferPool.getInstance();
  const snapshots: MemorySnapshot[] = [];

  snapshots.push(takeSnapshot());

  const buffers: string[] = [];

  // Acquire buffers
  for (let i = 0; i < imageCount; i++) {
    const { id } = bufferPool.acquire(imageSize);
    buffers.push(id);

    if (i % 10 === 0) {
      snapshots.push(takeSnapshot());
    }
  }

  const peakSnapshot = takeSnapshot();

  // Release buffers
  for (const id of buffers) {
    bufferPool.release(id);
  }

  const finalSnapshot = takeSnapshot();

  console.log(`Initial Memory:  ${formatBytes(snapshots[0].heapUsed)}`);
  console.log(`Peak Memory:     ${formatBytes(peakSnapshot.heapUsed)}`);
  console.log(`Final Memory:    ${formatBytes(finalSnapshot.heapUsed)}`);
  console.log(`Memory Delta:    ${formatBytes(peakSnapshot.heapUsed - snapshots[0].heapUsed)}`);

  const stats = bufferPool.getStats();
  console.log(`\nBuffer Pool Stats:`);
  console.log(`  Total Buffers:    ${stats.totalBuffers}`);
  console.log(`  Available:        ${stats.availableBuffers}`);
  console.log(`  Hit Rate:         ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`  Total Memory:     ${formatBytes(stats.totalMemory)}`);
}

/**
 * Test traditional allocation memory usage
 */
async function testTraditionalAllocation(imageCount: number, imageSize: number) {
  console.log('\n=== Traditional Allocation Memory Test ===');

  const snapshots: MemorySnapshot[] = [];

  snapshots.push(takeSnapshot());

  const buffers: Buffer[] = [];

  // Allocate buffers
  for (let i = 0; i < imageCount; i++) {
    const buffer = Buffer.alloc(imageSize);
    buffers.push(buffer);

    if (i % 10 === 0) {
      snapshots.push(takeSnapshot());
    }
  }

  const peakSnapshot = takeSnapshot();

  // Clear buffers
  buffers.length = 0;

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const finalSnapshot = takeSnapshot();

  console.log(`Initial Memory:  ${formatBytes(snapshots[0].heapUsed)}`);
  console.log(`Peak Memory:     ${formatBytes(peakSnapshot.heapUsed)}`);
  console.log(`Final Memory:    ${formatBytes(finalSnapshot.heapUsed)}`);
  console.log(`Memory Delta:    ${formatBytes(peakSnapshot.heapUsed - snapshots[0].heapUsed)}`);
}

/**
 * Test shared memory usage
 */
async function testSharedMemory(imageCount: number, imageSize: number) {
  console.log('\n=== Shared Memory Test ===');

  const memoryManager = MemoryManager.getInstance();
  const snapshots: MemorySnapshot[] = [];

  snapshots.push(takeSnapshot());

  const regions: string[] = [];

  // Create shared memory regions
  for (let i = 0; i < imageCount; i++) {
    const data = randomBytes(imageSize);
    const region = memoryManager.createRegion(imageSize, data);
    regions.push(region.id);

    if (i % 10 === 0) {
      snapshots.push(takeSnapshot());
    }
  }

  const peakSnapshot = takeSnapshot();

  // Release regions
  for (const id of regions) {
    memoryManager.releaseRegion(id);
  }

  const finalSnapshot = takeSnapshot();

  console.log(`Initial Memory:  ${formatBytes(snapshots[0].heapUsed)}`);
  console.log(`Peak Memory:     ${formatBytes(peakSnapshot.heapUsed)}`);
  console.log(`Final Memory:    ${formatBytes(finalSnapshot.heapUsed)}`);
  console.log(`Memory Delta:    ${formatBytes(peakSnapshot.heapUsed - snapshots[0].heapUsed)}`);

  const stats = memoryManager.getStats();
  console.log(`\nShared Memory Stats:`);
  console.log(`  Total Regions:    ${stats.totalRegions}`);
  console.log(`  Active Regions:   ${stats.activeRegions}`);
  console.log(`  Total Memory:     ${formatBytes(stats.totalMemory)}`);

  memoryManager.cleanup();
}

/**
 * Main
 */
async function main() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║        Memory Comparison - Buffer Management                ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  const imageCount = 50;
  const imageSize = 1920 * 1080 * 3; // 1080p RGB

  console.log(`\nConfiguration:`);
  console.log(`  Image Count: ${imageCount}`);
  console.log(`  Image Size:  ${formatBytes(imageSize)} per image`);
  console.log(`  Total Data:  ${formatBytes(imageCount * imageSize)}`);

  await testBufferPool(imageCount, imageSize);
  await testTraditionalAllocation(imageCount, imageSize);
  await testSharedMemory(imageCount, imageSize);

  console.log('\n✓ Memory comparison complete\n');
}

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}
