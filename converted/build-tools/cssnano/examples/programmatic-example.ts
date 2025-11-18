/**
 * Programmatic API Example - cssnano for Elide
 *
 * This example demonstrates how to use cssnano programmatically
 * in your build scripts or applications.
 */

import { process, presets } from '../index.ts';
import { readFile, writeFile } from 'fs/promises';

/**
 * Process a CSS file with a specific preset
 */
async function processFile(inputPath: string, outputPath: string, preset: string) {
  console.log(`Processing ${inputPath} with ${preset} preset...`);

  const startTime = performance.now();

  // Read the CSS file
  const css = await readFile(inputPath, 'utf-8');

  // Process with cssnano
  const result = await process(css, {
    preset: preset as any
  });

  // Write the result
  await writeFile(outputPath, result.css, 'utf-8');

  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);

  console.log(`✓ Processed in ${duration}ms`);
  if (result.stats) {
    console.log(`  Original: ${result.stats.originalSize} bytes`);
    console.log(`  Minified: ${result.stats.processedSize} bytes`);
    console.log(`  Savings: ${result.stats.efficiency.toFixed(2)}%`);
  }

  return result;
}

/**
 * Compare different presets
 */
async function comparePresets(css: string) {
  console.log('\n=== Comparing presets ===\n');

  const availablePresets = presets();

  for (const preset of availablePresets) {
    const result = await process(css, { preset: preset as any });

    console.log(`${preset.toUpperCase()} preset:`);
    if (result.stats) {
      console.log(`  Size: ${result.stats.processedSize} bytes`);
      console.log(`  Savings: ${result.stats.efficiency.toFixed(2)}%`);
      console.log(`  Time: ${result.stats.timeSpent.toFixed(2)}ms`);
    }
    console.log('');
  }
}

/**
 * Custom optimization configuration
 */
async function customOptimization(css: string) {
  console.log('\n=== Custom optimization configuration ===\n');

  // Example 1: Keep comments but optimize everything else
  const result1 = await process(css, {
    preset: ['default', {
      discardComments: false,
    }]
  });

  console.log('Configuration 1: Keep comments');
  console.log(`Output preview: ${result1.css.substring(0, 100)}...`);
  console.log(`Savings: ${result1.stats?.efficiency.toFixed(2)}%\n`);

  // Example 2: Minimal whitespace normalization only
  const result2 = await process(css, {
    preset: 'lite'
  });

  console.log('Configuration 2: Lite preset (minimal)');
  console.log(`Output preview: ${result2.css.substring(0, 100)}...`);
  console.log(`Savings: ${result2.stats?.efficiency.toFixed(2)}%\n`);

  // Example 3: Aggressive optimization
  const result3 = await process(css, {
    preset: 'advanced',
    reduceCalc: true,
    colormin: true,
  });

  console.log('Configuration 3: Advanced preset');
  console.log(`Output preview: ${result3.css.substring(0, 100)}...`);
  console.log(`Savings: ${result3.stats?.efficiency.toFixed(2)}%\n`);
}

/**
 * Batch processing with different presets
 */
async function batchProcessing(files: { input: string; preset: string }[]) {
  console.log('\n=== Batch processing ===\n');

  const startTime = performance.now();
  let totalOriginal = 0;
  let totalProcessed = 0;

  for (const { input, preset } of files) {
    const result = await process(input, { preset: preset as any });

    if (result.stats) {
      totalOriginal += result.stats.originalSize;
      totalProcessed += result.stats.processedSize;
    }

    console.log(`✓ Processed with ${preset} preset: ${result.stats?.processedSize} bytes`);
  }

  const endTime = performance.now();
  const totalDuration = (endTime - startTime).toFixed(2);

  console.log(`\n✓ Batch complete in ${totalDuration}ms`);
  console.log(`  Total original: ${totalOriginal} bytes`);
  console.log(`  Total processed: ${totalProcessed} bytes`);
  console.log(`  Total savings: ${((1 - totalProcessed / totalOriginal) * 100).toFixed(2)}%`);
}

/**
 * Performance measurement
 */
async function measurePerformance(css: string) {
  console.log('\n=== Performance measurement ===\n');

  const iterations = 100;
  const times: Record<string, number[]> = {};

  for (const preset of presets()) {
    times[preset] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await process(css, { preset: preset as any });
      times[preset].push(performance.now() - start);
    }
  }

  for (const preset of presets()) {
    const avgTime = times[preset].reduce((a, b) => a + b, 0) / iterations;
    const minTime = Math.min(...times[preset]);
    const maxTime = Math.max(...times[preset]);

    console.log(`${preset.toUpperCase()} preset (${iterations} iterations):`);
    console.log(`  Average: ${avgTime.toFixed(3)}ms`);
    console.log(`  Min: ${minTime.toFixed(3)}ms`);
    console.log(`  Max: ${maxTime.toFixed(3)}ms`);
    console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} operations/second`);
    console.log('');
  }
}

/**
 * Main example
 */
async function main() {
  console.log('=== cssnano Programmatic API Example ===\n');

  // Sample CSS
  const sampleCSS = `
.container {
  display: flex;
  flex-direction: column;
  color: #ffffff;
  margin: 0px 0px 0px 0px;
  font-weight: bold;
}

.box {
  background-color: #ff0000;
  padding: 10px 10px 10px 10px;
  border-radius: 5px;
}

/* This is a useful comment */
.text {
  color: rgba(255, 255, 255, 1);
  font-weight: normal;
  text-align: center;
}

.header {
  font-size: 24px;
  margin-top: 0px;
  padding: 0px 0px 0px 0px;
}

.footer {
  background: #000000;
  color: #ffffff;
}
`;

  // Example 1: Basic processing
  console.log('Example 1: Basic processing (default preset)\n');
  const result1 = await process(sampleCSS);
  console.log('Minified CSS:');
  console.log(result1.css);
  console.log(`\nSavings: ${result1.stats?.efficiency.toFixed(2)}%\n`);

  // Example 2: Compare presets
  console.log('='.repeat(60));
  await comparePresets(sampleCSS);

  // Example 3: Custom optimization
  console.log('='.repeat(60));
  await customOptimization(sampleCSS);

  // Example 4: Batch processing
  console.log('='.repeat(60));
  await batchProcessing([
    { input: sampleCSS, preset: 'lite' },
    { input: sampleCSS, preset: 'default' },
    { input: sampleCSS, preset: 'advanced' },
  ]);

  // Example 5: Performance measurement
  console.log('='.repeat(60));
  await measurePerformance(sampleCSS);

  // Example 6: Integration example
  console.log('='.repeat(60) + '\n');
  console.log('Example: Build pipeline integration\n');

  console.log('```typescript');
  console.log('// In your build script');
  console.log('import { process } from "@elide/cssnano";');
  console.log('import { glob } from "glob";');
  console.log('');
  console.log('const cssFiles = await glob("src/**/*.css");');
  console.log('');
  console.log('for (const file of cssFiles) {');
  console.log('  const css = await readFile(file, "utf-8");');
  console.log('  const result = await process(css, {');
  console.log('    preset: "advanced"');
  console.log('  });');
  console.log('  const outFile = file.replace("src/", "dist/").replace(".css", ".min.css");');
  console.log('  await writeFile(outFile, result.css);');
  console.log('}');
  console.log('```');
}

// Run the example
main().catch(console.error);
