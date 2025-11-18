/**
 * Programmatic API Example - clean-css for Elide
 *
 * This example demonstrates how to use clean-css programmatically
 * in your build scripts or applications.
 */

import CleanCSS, { minify, minifyAsync } from '../index.ts';
import { readFile, writeFile } from 'fs/promises';

/**
 * Minify a CSS file
 */
async function minifyFile(inputPath: string, outputPath: string) {
  console.log(`Minifying ${inputPath}...`);

  const startTime = performance.now();

  // Read the CSS file
  const css = await readFile(inputPath, 'utf-8');

  // Minify with level 2 optimization
  const output = await minifyAsync(css, {
    level: 2,
    sourceMap: true,
  });

  // Write the result
  await writeFile(outputPath, output.styles, 'utf-8');

  if (output.sourceMap) {
    await writeFile(`${outputPath}.map`, JSON.stringify(output.sourceMap), 'utf-8');
  }

  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);

  console.log(`✓ Minified in ${duration}ms`);
  console.log(`  Original: ${output.stats.originalSize} bytes`);
  console.log(`  Minified: ${output.stats.minifiedSize} bytes`);
  console.log(`  Savings: ${output.stats.efficiency.toFixed(2)}%`);

  return output;
}

/**
 * Batch minify multiple CSS files
 */
async function batchMinify(files: string[]) {
  console.log(`\nBatch minifying ${files.length} files...\n`);

  const startTime = performance.now();
  const cleaner = new CleanCSS({ level: 2 });

  let totalOriginal = 0;
  let totalMinified = 0;

  for (const file of files) {
    const css = await readFile(file, 'utf-8');
    const output = cleaner.minify(css);

    const outputFile = file.replace('.css', '.min.css');
    await writeFile(outputFile, output.styles, 'utf-8');

    totalOriginal += output.stats.originalSize;
    totalMinified += output.stats.minifiedSize;

    console.log(`✓ ${file} -> ${outputFile} (${output.stats.efficiency.toFixed(1)}% savings)`);
  }

  const endTime = performance.now();
  const totalDuration = (endTime - startTime).toFixed(2);

  console.log(`\n✓ Batch complete in ${totalDuration}ms`);
  console.log(`  Total original: ${totalOriginal} bytes`);
  console.log(`  Total minified: ${totalMinified} bytes`);
  console.log(`  Total savings: ${((1 - totalMinified / totalOriginal) * 100).toFixed(2)}%`);
  console.log(`  Average: ${(parseFloat(totalDuration) / files.length).toFixed(2)}ms per file`);
}

/**
 * Compare optimization levels
 */
function compareOptimizationLevels(css: string) {
  console.log('\n=== Comparing optimization levels ===\n');

  const levels = [
    { level: 0, name: 'Level 0 (None)' },
    { level: 1, name: 'Level 1 (Basic)' },
    { level: 2, name: 'Level 2 (Advanced)' },
  ];

  console.log(`Original size: ${css.length} bytes\n`);

  for (const { level, name } of levels) {
    const cleaner = new CleanCSS({ level } as any);
    const output = cleaner.minify(css);

    console.log(`${name}:`);
    console.log(`  Size: ${output.stats.minifiedSize} bytes`);
    console.log(`  Savings: ${output.stats.efficiency.toFixed(2)}%`);
    console.log(`  Time: ${output.stats.timeSpent.toFixed(2)}ms`);
    console.log('');
  }
}

/**
 * Demonstrate beautification
 */
function demonstrateBeautify(css: string) {
  console.log('\n=== Beautification example ===\n');

  const cleaner = new CleanCSS({
    level: 1,
    format: {
      beautify: true,
      indent: '  ',
      breaks: {
        afterAtRule: true,
        afterBlockEnds: true,
        afterRuleEnds: true,
      },
    },
  });

  const output = cleaner.minify(css);

  console.log('Beautified output:');
  console.log(output.styles);
  console.log('');
}

/**
 * Performance measurement
 */
function measurePerformance(css: string) {
  console.log('\n=== Performance measurement ===\n');

  const iterations = 100;
  const cleaner = new CleanCSS({ level: 2 });
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    cleaner.minify(css);
    times.push(performance.now() - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log(`Processed ${iterations} times:`);
  console.log(`  Average: ${avgTime.toFixed(3)}ms`);
  console.log(`  Min: ${minTime.toFixed(3)}ms`);
  console.log(`  Max: ${maxTime.toFixed(3)}ms`);
  console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} operations/second`);
  console.log('');
}

/**
 * Main example
 */
function main() {
  console.log('=== clean-css Programmatic API Example ===\n');

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

.container {
  background: rgba(0, 0, 0, 0.5);
}

.text {
  color: #aabbcc;
  font-weight: normal;
  text-align: center;
}

.header {
  font-size: 24px;
  margin-top: 0px;
  padding: 0px 0px 0px 0px;
}
`;

  // Example 1: Basic minification
  console.log('Example 1: Basic minification\n');
  const output1 = minify(sampleCSS);
  console.log('Minified CSS:');
  console.log(output1.styles);
  console.log(`\nSavings: ${output1.stats.efficiency.toFixed(2)}%\n`);

  // Example 2: Advanced minification
  console.log('='.repeat(60) + '\n');
  console.log('Example 2: Advanced minification (Level 2)\n');
  const output2 = minify(sampleCSS, { level: 2 });
  console.log('Minified CSS:');
  console.log(output2.styles);
  console.log(`\nSavings: ${output2.stats.efficiency.toFixed(2)}%\n`);

  // Example 3: Compare optimization levels
  console.log('='.repeat(60));
  compareOptimizationLevels(sampleCSS);

  // Example 4: Beautification
  console.log('='.repeat(60));
  demonstrateBeautify(sampleCSS);

  // Example 5: Performance measurement
  console.log('='.repeat(60));
  measurePerformance(sampleCSS);

  // Example 6: Error handling
  console.log('='.repeat(60) + '\n');
  console.log('Example 6: Error and warning handling\n');

  const invalidCSS = '.broken { color: }';
  const output3 = minify(invalidCSS);

  console.log('Input:', invalidCSS);
  console.log('Output:', output3.styles);
  console.log('Errors:', output3.errors.length);
  console.log('Warnings:', output3.warnings.length);
  console.log('');
}

// Run the example
main();
