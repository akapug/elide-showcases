/**
 * Ora Programmatic API Usage Examples
 */

import ora from '../index';

// Example 1: Basic usage
async function example1() {
  console.log('=== Example 1: Basic Usage ===');

  const spinner = ora('Loading...').start();
  await new Promise(resolve => setTimeout(resolve, 2000));
  spinner.succeed('Done!');
  console.log('');
}

// Example 2: Update text during operation
async function example2() {
  console.log('=== Example 2: Updating Text ===');

  const spinner = ora('Starting...').start();

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.text = 'Processing...';

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.text = 'Almost done...';

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.succeed('Complete!');
  console.log('');
}

// Example 3: Different spinner types
async function example3() {
  console.log('=== Example 3: Different Spinners ===');

  const spinnerTypes = ['dots', 'line', 'star', 'circle'];

  for (const type of spinnerTypes) {
    const spinner = ora({ text: `Using ${type} spinner`, spinner: type }).start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.succeed(`${type} complete`);
  }
  console.log('');
}

// Example 4: Color variations
async function example4() {
  console.log('=== Example 4: Colors ===');

  const colors = ['green', 'yellow', 'cyan', 'magenta'] as const;

  for (const color of colors) {
    const spinner = ora({ text: `${color} spinner`, color }).start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.stop();
  }
  console.log('');
}

// Example 5: Success/Fail/Warn/Info
async function example5() {
  console.log('=== Example 5: Different End States ===');

  const spinner1 = ora('Success example').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner1.succeed('Operation succeeded!');

  const spinner2 = ora('Failure example').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner2.fail('Operation failed!');

  const spinner3 = ora('Warning example').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner3.warn('Operation has warnings!');

  const spinner4 = ora('Info example').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner4.info('Information message');
  console.log('');
}

// Example 6: Build process simulation
async function example6() {
  console.log('=== Example 6: Build Process ===');

  const spinner = ora('Building project...').start();

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.text = 'Compiling TypeScript...';

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.text = 'Bundling assets...';

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.text = 'Minifying output...';

  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.succeed('Build complete!');
  console.log('');
}

// Example 7: Package installation
async function example7() {
  console.log('=== Example 7: Package Installation ===');

  const packages = ['express', 'lodash', 'axios'];
  const spinner = ora().start();

  for (let i = 0; i < packages.length; i++) {
    spinner.text = `Installing ${packages[i]} (${i + 1}/${packages.length})`;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  spinner.succeed(`Installed ${packages.length} packages!`);
  console.log('');
}

// Example 8: Database operations
async function example8() {
  console.log('=== Example 8: Database Operations ===');

  const spinner = ora('Connecting to database...').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.succeed('Connected!');

  spinner.start('Running migrations...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  spinner.succeed('Migrations complete!');

  spinner.start('Seeding data...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  spinner.succeed('Data seeded!');
  console.log('');
}

// Example 9: Error handling
async function example9() {
  console.log('=== Example 9: Error Handling ===');

  const spinner = ora('Attempting risky operation...').start();

  try {
    await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Something went wrong')), 1500);
    });
    spinner.succeed('Success');
  } catch (error) {
    spinner.fail('Failed: ' + (error as Error).message);
  }
  console.log('');
}

// Example 10: Progress indication
async function example10() {
  console.log('=== Example 10: Progress Indication ===');

  const total = 10;
  const spinner = ora().start();

  for (let i = 1; i <= total; i++) {
    spinner.text = `Processing item ${i}/${total} (${Math.round((i / total) * 100)}%)`;
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  spinner.succeed('All items processed!');
  console.log('');
}

// Run all examples
async function runAllExamples() {
  await example1();
  await example2();
  await example3();
  await example4();
  await example5();
  await example6();
  await example7();
  await example8();
  await example9();
  await example10();

  console.log('=== All examples completed ===');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  example1, example2, example3, example4, example5,
  example6, example7, example8, example9, example10
};
