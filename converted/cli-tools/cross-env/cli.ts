#!/usr/bin/env elide
/**
 * Cross-Env CLI
 *
 * Command-line interface for cross-platform environment variable setting.
 * This script serves as the main entry point when cross-env is invoked from the command line.
 *
 * @module @elide/cross-env/cli
 */

import { crossEnv, parseArgs } from './index';

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
cross-env - Set environment variables cross-platform

Usage:
  cross-env [VARIABLE=value ...] <command> [args...]

Examples:
  cross-env NODE_ENV=production node app.js
  cross-env PORT=3000 API_KEY=secret npm start
  cross-env DEBUG=* NODE_ENV=test npm test

Options:
  -h, --help     Show this help message
  -v, --version  Show version information

Environment Variables:
  Set one or more environment variables before the command:
    VARIABLE=value

  Values can be quoted:
    VARIABLE="value with spaces"
    VARIABLE='single quotes'

  Multiple variables:
    VAR1=value1 VAR2=value2 command

Features:
  - Cross-platform (Windows, macOS, Linux)
  - Preserves exit codes
  - Forwards signals (SIGTERM, SIGINT)
  - Supports quoted values
  - Zero configuration required

Documentation:
  https://github.com/elide-dev/cross-env

License: MIT
  `);
}

/**
 * Display version information
 */
function showVersion(): void {
  const version = '1.0.0'; // This should ideally come from package.json
  console.log(`cross-env version ${version} (Elide)`);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  // Handle version flag
  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    process.exit(0);
  }

  try {
    // Parse and validate arguments
    const { env, command } = parseArgs(args);

    if (command.length === 0) {
      console.error('Error: No command specified');
      console.error('');
      console.error('Usage: cross-env VARIABLE=value command [args...]');
      console.error('');
      console.error('Run "cross-env --help" for more information');
      process.exit(1);
    }

    // Show what environment variables are being set (debug mode)
    if (process.env.CROSS_ENV_DEBUG === 'true') {
      console.log('Environment variables:');
      Object.entries(env).forEach(([key, value]) => {
        console.log(`  ${key}=${value}`);
      });
      console.log('Command:', command.join(' '));
      console.log('');
    }

    // Execute the command with environment variables
    const result = await crossEnv(args);

    // Exit with the same code as the child process
    process.exit(result.exitCode);
  } catch (error) {
    // Handle errors gracefully
    if (error instanceof Error) {
      console.error('Error:', error.message);

      // Provide helpful error messages for common issues
      if (error.message.includes('ENOENT')) {
        console.error('');
        console.error('Command not found. Make sure the command is installed and in your PATH.');
      } else if (error.message.includes('EACCES')) {
        console.error('');
        console.error('Permission denied. Check file permissions and try again.');
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }

    process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
