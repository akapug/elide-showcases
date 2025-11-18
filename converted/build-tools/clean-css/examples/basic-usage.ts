/**
 * Basic Usage Example - clean-css for Elide
 *
 * This example demonstrates basic usage of clean-css
 * for minifying and optimizing CSS.
 */

import CleanCSS, { minify } from '../index.ts';

// Example CSS to minify
const inputCSS = `
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
  border-radius: 0.5em;
}

/* Duplicate selector - will be merged in level 2 */
.container {
  background: rgba(0, 0, 0, 0.5);
}

.text {
  color: #aabbcc;
  font-weight: normal;
}
`;

function main() {
  console.log('=== clean-css Basic Usage Example ===\n');

  // Method 1: Using the convenience function
  console.log('Method 1: Using convenience function\n');

  const result1 = minify(inputCSS);

  console.log('Input CSS:');
  console.log(inputCSS);
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Output CSS (Level 1):');
  console.log(result1.styles);
  console.log('\nStatistics:');
  console.log(`  Original size: ${result1.stats.originalSize} bytes`);
  console.log(`  Minified size: ${result1.stats.minifiedSize} bytes`);
  console.log(`  Savings: ${result1.stats.efficiency.toFixed(2)}%`);
  console.log(`  Time: ${result1.stats.timeSpent.toFixed(2)}ms`);

  // Method 2: Using CleanCSS class with level 2
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Method 2: Using CleanCSS class (Level 2)\n');

  const cleaner = new CleanCSS({
    level: 2,
  });

  const result2 = cleaner.minify(inputCSS);

  console.log('Output CSS (Level 2):');
  console.log(result2.styles);
  console.log('\nStatistics:');
  console.log(`  Original size: ${result2.stats.originalSize} bytes`);
  console.log(`  Minified size: ${result2.stats.minifiedSize} bytes`);
  console.log(`  Savings: ${result2.stats.efficiency.toFixed(2)}%`);
  console.log(`  Time: ${result2.stats.timeSpent.toFixed(2)}ms`);

  // Method 3: Beautified output
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Method 3: Beautified output\n');

  const cleaner3 = new CleanCSS({
    level: 1,
    format: {
      beautify: true,
      indent: '  ',
    },
  });

  const result3 = cleaner3.minify(inputCSS);

  console.log('Output CSS (Beautified):');
  console.log(result3.styles);

  // Compare all methods
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Comparison:\n');
  console.log(`Original:    ${inputCSS.length} bytes (100%)`);
  console.log(`Level 1:     ${result1.stats.minifiedSize} bytes (${(100 - result1.stats.efficiency).toFixed(1)}%) - ${result1.stats.efficiency.toFixed(1)}% savings`);
  console.log(`Level 2:     ${result2.stats.minifiedSize} bytes (${(100 - result2.stats.efficiency).toFixed(1)}%) - ${result2.stats.efficiency.toFixed(1)}% savings`);
  console.log(`Beautified:  ${result3.stats.minifiedSize} bytes (${(100 - result3.stats.efficiency).toFixed(1)}%) - ${result3.stats.efficiency.toFixed(1)}% savings`);
}

// Run the example
main();
