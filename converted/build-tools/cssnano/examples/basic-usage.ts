/**
 * Basic Usage Example - cssnano for Elide
 *
 * This example demonstrates basic usage of cssnano
 * for modular CSS minification with different presets.
 */

import { process, presets } from '../index.ts';

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

/* This is a comment that will be removed */
.text {
  color: rgba(255, 255, 255, 1);
  font-weight: normal;
}

.header {
  font-size: 24px;
  margin-top: 0px;
}
`;

async function main() {
  console.log('=== cssnano Basic Usage Example ===\n');

  // Show available presets
  console.log('Available presets:', presets().join(', '));
  console.log('\n' + '='.repeat(60) + '\n');

  // Example 1: Lite preset (minimal optimization)
  console.log('Example 1: Lite Preset (minimal optimization)\n');

  const result1 = await process(inputCSS, {
    preset: 'lite'
  });

  console.log('Input CSS:');
  console.log(inputCSS);
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Output CSS (Lite):');
  console.log(result1.css);
  console.log('\nStatistics:');
  console.log(`  Original size: ${result1.stats?.originalSize} bytes`);
  console.log(`  Processed size: ${result1.stats?.processedSize} bytes`);
  console.log(`  Savings: ${result1.stats?.efficiency.toFixed(2)}%`);
  console.log(`  Time: ${result1.stats?.timeSpent.toFixed(2)}ms`);

  // Example 2: Default preset (balanced optimization)
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Example 2: Default Preset (balanced optimization)\n');

  const result2 = await process(inputCSS, {
    preset: 'default'
  });

  console.log('Output CSS (Default):');
  console.log(result2.css);
  console.log('\nStatistics:');
  console.log(`  Original size: ${result2.stats?.originalSize} bytes`);
  console.log(`  Processed size: ${result2.stats?.processedSize} bytes`);
  console.log(`  Savings: ${result2.stats?.efficiency.toFixed(2)}%`);
  console.log(`  Time: ${result2.stats?.timeSpent.toFixed(2)}ms`);

  // Example 3: Advanced preset (aggressive optimization)
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Example 3: Advanced Preset (aggressive optimization)\n');

  const result3 = await process(inputCSS, {
    preset: 'advanced'
  });

  console.log('Output CSS (Advanced):');
  console.log(result3.css);
  console.log('\nStatistics:');
  console.log(`  Original size: ${result3.stats?.originalSize} bytes`);
  console.log(`  Processed size: ${result3.stats?.processedSize} bytes`);
  console.log(`  Savings: ${result3.stats?.efficiency.toFixed(2)}%`);
  console.log(`  Time: ${result3.stats?.timeSpent.toFixed(2)}ms`);

  // Example 4: Custom preset configuration
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Example 4: Custom preset configuration\n');

  const result4 = await process(inputCSS, {
    preset: ['default', {
      discardComments: false,  // Keep comments
    }]
  });

  console.log('Output CSS (Custom - comments kept):');
  console.log(result4.css);

  // Compare all presets
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Comparison:\n');
  console.log(`Original:  ${inputCSS.length} bytes (100%)`);
  console.log(`Lite:      ${result1.stats?.processedSize} bytes (${(100 - (result1.stats?.efficiency || 0)).toFixed(1)}%) - ${result1.stats?.efficiency.toFixed(1)}% savings`);
  console.log(`Default:   ${result2.stats?.processedSize} bytes (${(100 - (result2.stats?.efficiency || 0)).toFixed(1)}%) - ${result2.stats?.efficiency.toFixed(1)}% savings`);
  console.log(`Advanced:  ${result3.stats?.processedSize} bytes (${(100 - (result3.stats?.efficiency || 0)).toFixed(1)}%) - ${result3.stats?.efficiency.toFixed(1)}% savings`);
}

// Run the example
main().catch(console.error);
