/**
 * Basic Usage Example - Autoprefixer for Elide
 *
 * This example demonstrates basic usage of Autoprefixer
 * for adding vendor prefixes to CSS.
 */

import autoprefixer, { process } from '../index.ts';

// Example CSS without vendor prefixes
const inputCSS = `
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.box {
  transform: rotate(45deg);
  transition: all 0.3s ease;
  user-select: none;
  backdrop-filter: blur(10px);
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.sticky-header {
  position: sticky;
  top: 0;
}
`;

async function main() {
  console.log('=== Autoprefixer Basic Usage Example ===\n');

  // Method 1: Using the convenience process() function
  console.log('Method 1: Direct processing\n');

  const result1 = await process(inputCSS, {
    browsers: ['last 2 versions', '> 1%'],
  });

  console.log('Input CSS:');
  console.log(inputCSS);
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Output CSS with vendor prefixes:');
  console.log(result1);

  // Method 2: Using with specific browser targets
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Method 2: Targeting specific browsers (IE 11 support)\n');

  const result2 = await process(inputCSS, {
    browsers: ['ie >= 11', 'last 2 versions'],
    flexbox: true,
    grid: 'autoplace',
  });

  console.log('Output CSS with IE 11 prefixes:');
  console.log(result2);

  // Method 3: Different browser targets
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Method 3: Modern browsers only\n');

  const result3 = await process(inputCSS, {
    browsers: ['last 1 version', '> 2%'],
    flexbox: false,
  });

  console.log('Output CSS for modern browsers:');
  console.log(result3);

  // Show statistics
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('Statistics:');
  console.log(`Input size: ${inputCSS.length} bytes`);
  console.log(`Output size: ${result1.length} bytes`);
  console.log(`Size increase: ${((result1.length / inputCSS.length - 1) * 100).toFixed(1)}%`);
}

// Run the example
main().catch(console.error);
