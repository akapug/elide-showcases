#!/usr/bin/env elide
/**
 * Minimist CLI Demo
 *
 * A simple command-line interface that demonstrates minimist's argument parsing capabilities.
 * This can be used as a standalone testing tool or as a reference implementation.
 *
 * @module @elide/minimist/cli
 */

import minimist from './index';

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
minimist - Argument parser for CLI applications

Usage:
  minimist [options] [arguments...]

This is a demonstration tool that shows how minimist parses command-line arguments.
It will output the parsed arguments as JSON.

Examples:
  minimist --name Bob --age 25
  minimist -x 3 -y 4 -z 5
  minimist --verbose --output=file.txt
  minimist -abc (expands to -a -b -c)
  minimist --no-color (sets color: false)
  minimist --tags=foo --tags=bar (creates array)
  minimist -- these are positional args

Options:
  -h, --help     Show this help message
  -v, --version  Show version information
  --json         Output as formatted JSON (default)
  --compact      Output as compact JSON

Features:
  - Automatic type detection (numbers, booleans, strings)
  - Short flag expansion (-abc = -a -b -c)
  - Boolean flags (--flag or --no-flag)
  - Key-value pairs (--key=value)
  - Array accumulation (--tag=a --tag=b)
  - Positional arguments
  - Double-dash separator (-- for bare args)

Documentation:
  https://github.com/elide-dev/minimist

License: MIT
  `);
}

/**
 * Display version information
 */
function showVersion(): void {
  const version = '1.0.0';
  console.log(`minimist version ${version} (Elide)`);
}

/**
 * Main CLI function
 */
function main(): void {
  const args = process.argv.slice(2);

  // Parse with basic options
  const argv = minimist(args, {
    boolean: ['help', 'version', 'json', 'compact'],
    alias: {
      h: 'help',
      v: 'version'
    },
    default: {
      json: true,
      compact: false
    }
  });

  // Handle help flag
  if (argv.help) {
    showHelp();
    process.exit(0);
  }

  // Handle version flag
  if (argv.version) {
    showVersion();
    process.exit(0);
  }

  // Remove our internal flags from output
  const output = { ...argv };
  delete output.json;
  delete output.compact;
  delete output.help;
  delete output.version;
  delete output.h;
  delete output.v;

  // Output the parsed arguments
  console.log('Parsed arguments:');
  console.log('');

  if (argv.compact) {
    console.log(JSON.stringify(output));
  } else {
    console.log(JSON.stringify(output, null, 2));
  }

  console.log('');
  console.log('Explanation:');
  console.log('  _ : Positional arguments (non-flag arguments)');
  if (output['--']) {
    console.log('  -- : Arguments after -- separator');
  }
  console.log('  Other keys: Named arguments from flags');
}

// Run the CLI
main();
