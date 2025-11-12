/**
 * Example: Using the Elide Performance Profiler
 */

import ElideProfiler from '../profiler/src/profiler';

async function main() {
  // Create profiler instance
  const profiler = new ElideProfiler({
    sampleInterval: 1000, // 1ms
    maxDepth: 50,
    includeNative: false,
    trackAllocations: true
  });

  console.log('Starting performance profiling...\n');

  // Listen for profiler events
  profiler.on('started', () => {
    console.log('[Profiler] Started');
  });

  profiler.on('stopped', (result) => {
    console.log('[Profiler] Stopped');
    console.log(`Collected ${result.samples} samples over ${result.duration.toFixed(2)}ms`);
  });

  // Start profiling
  await profiler.start();

  // Simulate workload
  console.log('Running workload...\n');

  // CPU-intensive task
  function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  // Track async operation
  const asyncOpId = profiler.trackAsyncOperation(
    'fetchData',
    [{ functionName: 'main', fileName: 'profiler-example.ts', lineNumber: 50, columnNumber: 0 }]
  );

  // Simulate async work
  setTimeout(() => {
    profiler.completeAsyncOperation(asyncOpId, 'resolved');
  }, 1000);

  // Record some events
  profiler.recordEvent({
    name: 'Task Started',
    category: 'user',
    timestamp: performance.now(),
    phase: 'B'
  });

  // Do some work
  for (let i = 0; i < 10; i++) {
    fibonacci(30);
  }

  profiler.recordEvent({
    name: 'Task Started',
    category: 'user',
    timestamp: performance.now(),
    phase: 'E'
  });

  // Track allocations
  for (let i = 0; i < 100; i++) {
    profiler.trackAllocation(
      1024 * i,
      'Object',
      [{ functionName: 'allocate', fileName: 'profiler-example.ts', lineNumber: 80, columnNumber: 0 }]
    );
  }

  // Record frame timing
  for (let i = 0; i < 60; i++) {
    const duration = 10 + Math.random() * 20;
    profiler.recordFrame(i, performance.now(), duration);
  }

  // Wait for async operations
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Stop profiling
  const result = await profiler.stop();

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('PROFILE RESULTS');
  console.log('='.repeat(60));
  console.log(`Duration:          ${result.duration.toFixed(2)}ms`);
  console.log(`Samples Collected: ${result.samples}`);
  console.log(`Event Traces:      ${result.eventTraces.length}`);
  console.log(`Async Operations:  ${result.asyncOperations.length}`);

  // Hotspots
  console.log('\nTOP HOTSPOTS:');
  for (const hotspot of result.hotspots.slice(0, 10)) {
    console.log(`  ${hotspot.functionName} (${hotspot.fileName})`);
    console.log(`    Time: ${hotspot.percentage.toFixed(2)}% (${hotspot.hitCount} hits)`);
    console.log(`    ${hotspot.suggestion}`);
  }

  // Flame graph
  console.log('\nFLAME GRAPH (Top Functions):');
  printFlameGraph(result.flameGraph, 0, 3);

  // Async operations
  console.log('\nASYNC OPERATIONS:');
  for (const op of result.asyncOperations) {
    const status = op.status === 'resolved' ? '✓' : op.status === 'rejected' ? '✗' : '⏳';
    console.log(`  ${status} ${op.name}: ${op.duration?.toFixed(2) || 'pending'}ms`);
  }

  // Allocation profile
  if (result.allocationProfile) {
    console.log('\nALLOCATION PROFILE:');
    console.log(`  Total Allocated: ${formatBytes(result.allocationProfile.totalAllocated)}`);
    console.log(`  Total Freed:     ${formatBytes(result.allocationProfile.totalFreed)}`);
    console.log(`  Live Objects:    ${result.allocationProfile.liveObjects}`);
  }

  // Frame statistics
  const frameStats = profiler.getFrameStats();
  console.log('\nFRAME STATISTICS:');
  console.log(`  Total Frames:    ${frameStats.totalFrames}`);
  console.log(`  Dropped Frames:  ${frameStats.droppedFrames}`);
  console.log(`  Average Duration: ${frameStats.averageDuration.toFixed(2)}ms`);
  console.log(`  Max Duration:    ${frameStats.maxDuration.toFixed(2)}ms`);
  console.log(`  FPS:             ${frameStats.fps.toFixed(2)}`);

  // Recommendations
  console.log('\nRECOMMENDATIONS:');
  for (const rec of result.recommendations) {
    console.log(`  - ${rec}`);
  }

  // Export profile
  const chromeProfile = profiler.exportProfile('chrome');
  console.log(`\nProfile exported (Chrome DevTools format)`);
  console.log(`Nodes: ${chromeProfile.nodes.length}`);

  const firefoxProfile = profiler.exportProfile('firefox');
  console.log(`Profile exported (Firefox format)`);
  console.log(`Threads: ${firefoxProfile.threads.length}`);

  // Bundle analysis example
  console.log('\nBUNDLE ANALYSIS:');
  const bundleAnalysis = await profiler.analyzeBundle('dist/bundle.js');
  console.log(`  Total Size: ${formatBytes(bundleAnalysis.totalSize)}`);
  console.log(`  Modules:    ${bundleAnalysis.modules.length}`);
  console.log('\n  Largest Modules:');
  for (const mod of bundleAnalysis.largestModules.slice(0, 5)) {
    console.log(`    ${mod.name.padEnd(20)} ${formatBytes(mod.size).padStart(10)} (gzip: ${formatBytes(mod.gzipSize)})`);
  }

  // Startup profiling
  console.log('\nSTARTUP PROFILE:');
  const startupProfile = await profiler.profileStartup();
  console.log(`  Total Time: ${startupProfile.totalTime}ms`);
  console.log('\n  Phases:');
  for (const phase of startupProfile.phases) {
    console.log(`    ${phase.name.padEnd(20)} ${phase.duration.toString().padStart(6)}ms (${phase.percentage}%)`);
  }

  if (startupProfile.bottlenecks.length > 0) {
    console.log('\n  Bottlenecks:');
    for (const bottleneck of startupProfile.bottlenecks) {
      console.log(`    ${bottleneck.phase}: ${bottleneck.duration}ms`);
      console.log(`      ${bottleneck.reason}`);
      console.log(`      Suggestion: ${bottleneck.suggestion}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

function printFlameGraph(node: any, depth: number, maxDepth: number): void {
  if (depth >= maxDepth) return;

  const indent = '  '.repeat(depth);
  const bar = '█'.repeat(Math.floor(node.selfTime / 2));
  console.log(`${indent}${node.name} ${bar} ${node.selfTime.toFixed(1)}%`);

  // Sort children by time and show top 3
  const sortedChildren = [...node.children].sort((a, b) => b.selfTime - a.selfTime);
  for (const child of sortedChildren.slice(0, 3)) {
    printFlameGraph(child, depth + 1, maxDepth);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

main().catch(console.error);
