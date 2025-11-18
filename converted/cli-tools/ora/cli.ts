#!/usr/bin/env elide
/**
 * Ora CLI Demo
 *
 * A demonstration tool showing ora's spinner capabilities.
 * Can be used for testing and showcasing different spinner types and features.
 *
 * @module @elide/ora/cli
 */

import ora, { spinners } from './index';

function showHelp(): void {
  console.log(`
ora - Terminal spinner for CLI applications

Usage:
  ora [options]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -l, --list              List all available spinners
  -s, --spinner NAME      Use specific spinner (default: dots)
  -c, --color COLOR       Use specific color (default: cyan)
  -t, --text TEXT         Spinner text (default: "Loading...")
  -d, --duration MS       How long to spin (default: 3000ms)
  --demo                  Run demo of all spinners
  --success               End with success
  --fail                  End with failure
  --warn                  End with warning
  --info                  End with info

Colors:
  black, red, green, yellow, blue, magenta, cyan, white, gray

Examples:
  ora --text "Building project..."
  ora --spinner dots2 --color green
  ora --demo
  ora --list

Documentation:
  https://github.com/elide-dev/ora
  `);
}

function showVersion(): void {
  console.log('ora version 1.0.0 (Elide)');
}

function listSpinners(): void {
  console.log('Available spinners:\n');
  Object.keys(spinners).forEach(name => {
    const spinner = spinners[name];
    console.log(`  ${name.padEnd(20)} - ${spinner.frames.length} frames, ${spinner.interval}ms interval`);
  });
}

async function runDemo(): Promise<void> {
  console.log('Ora Spinner Demo\n');

  const spinnerNames = Object.keys(spinners).slice(0, 10); // Show first 10

  for (const name of spinnerNames) {
    const spinner = ora({
      text: `Demonstrating "${name}" spinner...`,
      spinner: name,
      color: 'cyan'
    }).start();

    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed(`"${name}" spinner complete!`);
  }

  console.log('\nDemo complete! Try "--list" to see all available spinners.');
}

async function runSpinner(options: {
  spinner: string;
  color: string;
  text: string;
  duration: number;
  endType: 'success' | 'fail' | 'warn' | 'info' | 'stop';
}): Promise<void> {
  const spinner = ora({
    text: options.text,
    spinner: options.spinner,
    color: options.color as any
  }).start();

  await new Promise(resolve => setTimeout(resolve, options.duration));

  switch (options.endType) {
    case 'success':
      spinner.succeed(options.text + ' Done!');
      break;
    case 'fail':
      spinner.fail(options.text + ' Failed!');
      break;
    case 'warn':
      spinner.warn(options.text + ' Warning!');
      break;
    case 'info':
      spinner.info(options.text + ' Info!');
      break;
    default:
      spinner.stop();
  }
}

function main(): void {
  const args = process.argv.slice(2);

  // Parse arguments (simple parsing)
  const options = {
    help: args.includes('-h') || args.includes('--help'),
    version: args.includes('-v') || args.includes('--version'),
    list: args.includes('-l') || args.includes('--list'),
    demo: args.includes('--demo'),
    spinner: args[args.indexOf('--spinner') + 1] || args[args.indexOf('-s') + 1] || 'dots',
    color: args[args.indexOf('--color') + 1] || args[args.indexOf('-c') + 1] || 'cyan',
    text: args[args.indexOf('--text') + 1] || args[args.indexOf('-t') + 1] || 'Loading...',
    duration: parseInt(args[args.indexOf('--duration') + 1] || args[args.indexOf('-d') + 1] || '3000'),
    success: args.includes('--success'),
    fail: args.includes('--fail'),
    warn: args.includes('--warn'),
    info: args.includes('--info')
  };

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  if (options.list) {
    listSpinners();
    process.exit(0);
  }

  if (options.demo) {
    runDemo().catch(console.error);
    return;
  }

  // Determine end type
  let endType: 'success' | 'fail' | 'warn' | 'info' | 'stop' = 'stop';
  if (options.success) endType = 'success';
  else if (options.fail) endType = 'fail';
  else if (options.warn) endType = 'warn';
  else if (options.info) endType = 'info';

  // Run spinner
  runSpinner({
    spinner: options.spinner,
    color: options.color,
    text: options.text,
    duration: options.duration,
    endType
  }).catch(console.error);
}

main();
