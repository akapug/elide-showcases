#!/usr/bin/env node
/**
 * Jest Clone - CLI
 * Command-line interface for running tests
 */

import { TestRunner } from '../core/runner';
import { DefaultReporter } from '../reporters/default';
import { CoverageCollector } from '../coverage/collector';
import { WatchMode } from '../watch/watcher';
import type { Config } from '../types';

interface CLIArgs {
  watch?: boolean;
  coverage?: boolean;
  verbose?: boolean;
  silent?: boolean;
  updateSnapshot?: boolean;
  testNamePattern?: string;
  testPathPattern?: string;
  maxWorkers?: number;
  bail?: number | boolean;
  config?: string;
  files?: string[];
}

class CLI {
  private args: CLIArgs = {};
  private config: Config = {};

  async run(argv: string[]): Promise<number> {
    try {
      this.parseArgs(argv);
      await this.loadConfig();
      this.mergeConfig();

      if (this.args.watch) {
        return await this.runWatchMode();
      } else {
        return await this.runTests();
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      return 1;
    }
  }

  private parseArgs(argv: string[]): void {
    const args = argv.slice(2);
    const files: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--watch') {
        this.args.watch = true;
      } else if (arg === '--coverage') {
        this.args.coverage = true;
      } else if (arg === '--verbose') {
        this.args.verbose = true;
      } else if (arg === '--silent') {
        this.args.silent = true;
      } else if (arg === '--updateSnapshot' || arg === '-u') {
        this.args.updateSnapshot = true;
      } else if (arg === '--testNamePattern' || arg === '-t') {
        this.args.testNamePattern = args[++i];
      } else if (arg === '--testPathPattern') {
        this.args.testPathPattern = args[++i];
      } else if (arg === '--maxWorkers' || arg === '-w') {
        this.args.maxWorkers = parseInt(args[++i], 10);
      } else if (arg === '--bail' || arg === '-b') {
        const next = args[i + 1];
        if (next && !next.startsWith('--')) {
          this.args.bail = parseInt(next, 10);
          i++;
        } else {
          this.args.bail = true;
        }
      } else if (arg === '--config' || arg === '-c') {
        this.args.config = args[++i];
      } else if (!arg.startsWith('--')) {
        files.push(arg);
      }
    }

    this.args.files = files;
  }

  private async loadConfig(): Promise<void> {
    const configPath = this.args.config || this.findConfigFile();
    if (configPath) {
      try {
        const module = await import(configPath);
        this.config = module.default || module;
      } catch (error) {
        console.warn(`Warning: Could not load config from ${configPath}`);
      }
    }
  }

  private findConfigFile(): string | null {
    const possiblePaths = [
      './jest.config.ts',
      './jest.config.js',
      './jest.config.json',
      './.jestrc.json',
      './.jestrc'
    ];

    for (const path of possiblePaths) {
      try {
        // Check if file exists
        return path;
      } catch {
        continue;
      }
    }

    return null;
  }

  private mergeConfig(): void {
    // Merge CLI args with config file
    if (this.args.verbose !== undefined) {
      this.config.verbose = this.args.verbose;
    }
    if (this.args.silent !== undefined) {
      this.config.silent = this.args.silent;
    }
    if (this.args.maxWorkers !== undefined) {
      this.config.maxWorkers = this.args.maxWorkers;
    }
    if (this.args.bail !== undefined) {
      this.config.bail = this.args.bail;
    }

    // Set defaults
    this.config.testMatch = this.config.testMatch || [
      '**/__tests__/**/*.ts',
      '**/*.test.ts',
      '**/*.spec.ts'
    ];
    this.config.maxWorkers = this.config.maxWorkers || 4;
    this.config.testTimeout = this.config.testTimeout || 5000;
  }

  private async runTests(): Promise<number> {
    const testFiles = await this.findTestFiles();

    if (testFiles.length === 0) {
      console.log('No test files found.');
      return 0;
    }

    console.log(`Found ${testFiles.length} test file(s)\n`);

    const runner = new TestRunner(this.config);
    const reporter = new DefaultReporter(this.config);
    runner.addReporter(reporter);

    const results = await runner.runTests(testFiles);

    // Collect coverage if requested
    if (this.args.coverage) {
      const collector = new CoverageCollector(this.config);
      const coverage = await collector.collect(testFiles);
      collector.report(coverage);
    }

    return results.success ? 0 : 1;
  }

  private async runWatchMode(): Promise<number> {
    const watcher = new WatchMode(this.config);
    await watcher.start();
    return 0;
  }

  private async findTestFiles(): Promise<string[]> {
    // If specific files provided, use those
    if (this.args.files && this.args.files.length > 0) {
      return this.args.files;
    }

    // Otherwise, find all test files matching patterns
    const patterns = this.config.testMatch || ['**/*.test.ts'];
    const testFiles: string[] = [];

    // In a real implementation, this would use glob patterns
    // For now, return empty array as placeholder
    return testFiles;
  }

  private printHelp(): void {
    console.log(`
Jest Clone - Delightful Testing Framework for Elide

Usage:
  jest [options] [files...]

Options:
  --watch, -w              Run tests in watch mode
  --coverage               Collect code coverage
  --verbose                Display individual test results
  --silent                 Prevent tests from printing messages
  --updateSnapshot, -u     Update snapshots
  --testNamePattern, -t    Run tests matching pattern
  --testPathPattern        Run test files matching pattern
  --maxWorkers, -w <n>     Number of parallel workers
  --bail, -b [n]           Exit after n failures
  --config, -c <path>      Path to config file
  --help, -h               Show this help

Examples:
  jest                     Run all tests
  jest --watch             Run tests in watch mode
  jest --coverage          Run tests with coverage
  jest math.test.ts        Run specific test file
  jest -t "adds numbers"   Run tests matching pattern

Configuration:
  Create a jest.config.ts file in your project root:

  export default {
    testMatch: ['**/*.test.ts'],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };

Documentation: https://docs.elide.dev/testing/jest-clone
    `);
  }
}

// Run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new CLI();
  cli.run(process.argv).then(code => {
    process.exit(code);
  });
}

export { CLI };
