/**
 * Programmatic API Example - Autoprefixer for Elide
 *
 * This example demonstrates how to use Autoprefixer programmatically
 * in your build scripts or applications.
 */

import autoprefixer, { process, info } from '../index.ts';
import { readFile, writeFile } from 'fs/promises';

/**
 * Process a CSS file and add vendor prefixes
 */
async function processCSSFile(inputPath: string, outputPath: string) {
  console.log(`Processing ${inputPath}...`);

  const startTime = performance.now();

  // Read the CSS file
  const css = await readFile(inputPath, 'utf-8');

  // Process with autoprefixer
  const result = await process(css, {
    browsers: ['last 2 versions', '> 1%', 'not dead'],
    flexbox: true,
    grid: 'autoplace',
  });

  // Write the result
  await writeFile(outputPath, result, 'utf-8');

  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);

  console.log(`✓ Processed in ${duration}ms`);
  console.log(`  Input: ${css.length} bytes`);
  console.log(`  Output: ${result.length} bytes`);

  return result;
}

/**
 * Batch process multiple CSS files
 */
async function batchProcess(files: string[]) {
  console.log(`\nBatch processing ${files.length} files...`);

  const startTime = performance.now();
  const results = [];

  for (const file of files) {
    const outputFile = file.replace('.css', '.prefixed.css');
    await processCSSFile(file, outputFile);
    results.push(outputFile);
  }

  const endTime = performance.now();
  const totalDuration = (endTime - startTime).toFixed(2);

  console.log(`\n✓ Batch processing complete in ${totalDuration}ms`);
  console.log(`  Average: ${(parseFloat(totalDuration) / files.length).toFixed(2)}ms per file`);

  return results;
}

/**
 * Process CSS string with different browser targets
 */
async function compareTargets(css: string) {
  console.log('\n=== Comparing different browser targets ===\n');

  const targets = [
    { name: 'Modern browsers', browsers: ['last 1 version'] },
    { name: 'Last 2 versions', browsers: ['last 2 versions'] },
    { name: 'IE 11 support', browsers: ['ie >= 11', 'last 2 versions'] },
    { name: 'Wide support', browsers: ['> 0.5%', 'last 2 versions', 'not dead'] },
  ];

  for (const target of targets) {
    const result = await process(css, { browsers: target.browsers });
    console.log(`${target.name}:`);
    console.log(`  Browsers: ${target.browsers.join(', ')}`);
    console.log(`  Output size: ${result.length} bytes`);
    console.log(`  Size increase: ${((result.length / css.length - 1) * 100).toFixed(1)}%`);
    console.log('');
  }
}

/**
 * Watch mode simulation - process on change
 */
async function watchModeExample(css: string) {
  console.log('\n=== Watch mode simulation ===\n');

  // Simulate multiple changes
  const changes = 5;

  for (let i = 1; i <= changes; i++) {
    const startTime = performance.now();

    await process(css, {
      browsers: ['last 2 versions'],
    });

    const duration = performance.now() - startTime;

    console.log(`Change ${i}: Processed in ${duration.toFixed(2)}ms`);

    // Simulate delay between changes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Main example
 */
async function main() {
  console.log('=== Autoprefixer Programmatic API Example ===\n');

  // Show info
  console.log(info());
  console.log('');

  // Sample CSS
  const sampleCSS = `
.modern-layout {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.animated-box {
  transform: scale(1.1);
  transition: transform 0.3s ease;
  backdrop-filter: blur(10px);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.sticky-nav {
  position: sticky;
  top: 0;
  user-select: none;
}
`;

  // Example 1: Process CSS string
  console.log('Example 1: Process CSS string\n');
  const result = await process(sampleCSS, {
    browsers: ['last 2 versions', '> 1%'],
  });
  console.log('Input:');
  console.log(sampleCSS);
  console.log('\nOutput:');
  console.log(result);

  // Example 2: Compare different targets
  await compareTargets(sampleCSS);

  // Example 3: Watch mode simulation
  await watchModeExample(sampleCSS);

  // Example 4: Performance measurement
  console.log('\n=== Performance measurement ===\n');

  const iterations = 100;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await process(sampleCSS, { browsers: ['last 2 versions'] });
    times.push(performance.now() - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log(`Processed ${iterations} times:`);
  console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min: ${minTime.toFixed(2)}ms`);
  console.log(`  Max: ${maxTime.toFixed(2)}ms`);
  console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} operations/second`);
}

// Run the example
main().catch(console.error);
