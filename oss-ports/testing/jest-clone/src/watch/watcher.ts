/**
 * Jest Clone - Watch Mode
 * Intelligent file watching and test re-running
 */

import type { Config, AggregatedResult } from '../types';
import { TestRunner } from '../core/runner';
import { DefaultReporter } from '../reporters/default';

export class WatchMode {
  private config: Config;
  private changedFiles: Set<string> = new Set();
  private isRunning = false;
  private lastResults: AggregatedResult | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log('\n🔍 Watch Mode - Press keys for actions:\n');
    console.log('  › Press a to run all tests');
    console.log('  › Press f to run only failed tests');
    console.log('  › Press o to run only tests related to changed files');
    console.log('  › Press p to filter by filename pattern');
    console.log('  › Press t to filter by test name pattern');
    console.log('  › Press q to quit\n');

    // Set up file watching
    this.watchFiles();

    // Set up keyboard input
    this.setupKeyboard();

    // Run initial tests
    await this.runTests();
  }

  private watchFiles(): void {
    // In a real implementation, this would use fs.watch or chokidar
    // to watch for file changes
    console.log('👀 Watching for file changes...\n');
  }

  private setupKeyboard(): void {
    // Set up stdin to receive keypresses
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (key: string) => {
        this.handleKeyPress(key);
      });
    }
  }

  private async handleKeyPress(key: string): Promise<void> {
    if (key === '\u0003' || key === 'q') {
      // Ctrl+C or 'q'
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
    } else if (key === 'a') {
      console.log('\n▶️  Running all tests...\n');
      await this.runTests();
    } else if (key === 'f') {
      console.log('\n▶️  Running failed tests...\n');
      await this.runFailedTests();
    } else if (key === 'o') {
      console.log('\n▶️  Running tests related to changed files...\n');
      await this.runChangedTests();
    } else if (key === 'p') {
      console.log('\n📝 Filter by filename pattern (not implemented in demo)');
    } else if (key === 't') {
      console.log('\n📝 Filter by test name pattern (not implemented in demo)');
    } else if (key === 'u') {
      console.log('\n📸 Updating snapshots...\n');
      this.config.bail = false;
      await this.runTests();
    }
  }

  async onFileChange(filePath: string): Promise<void> {
    if (this.isRunning) {
      this.changedFiles.add(filePath);
      return;
    }

    console.log(`\n📝 File changed: ${filePath}\n`);
    this.changedFiles.add(filePath);

    await this.runChangedTests();
  }

  private async runTests(files?: string[]): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    try {
      const testFiles = files || await this.findTestFiles();
      const runner = new TestRunner(this.config);
      const reporter = new DefaultReporter(this.config);

      runner.addReporter(reporter);

      this.lastResults = await runner.runTests(testFiles);
      this.printWatchUsage();
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      this.isRunning = false;

      // Run tests for files changed during execution
      if (this.changedFiles.size > 0) {
        const changed = Array.from(this.changedFiles);
        this.changedFiles.clear();
        await this.runChangedTests(changed);
      }
    }
  }

  private async runFailedTests(): Promise<void> {
    if (!this.lastResults) {
      console.log('No previous test results available.');
      return;
    }

    const failedFiles = this.lastResults.testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => result.testFilePath);

    if (failedFiles.length === 0) {
      console.log('✅ No failed tests to run.');
      return;
    }

    await this.runTests(failedFiles);
  }

  private async runChangedTests(changedFiles?: string[]): Promise<void> {
    const files = changedFiles || Array.from(this.changedFiles);
    this.changedFiles.clear();

    if (files.length === 0) {
      console.log('No changed files to test.');
      return;
    }

    // Find test files related to changed files
    const testFiles = await this.findRelatedTests(files);

    if (testFiles.length === 0) {
      console.log('No tests found for changed files.');
      return;
    }

    await this.runTests(testFiles);
  }

  private async findTestFiles(): Promise<string[]> {
    // In a real implementation, this would use glob patterns
    // to find all test files
    return [];
  }

  private async findRelatedTests(changedFiles: string[]): Promise<string[]> {
    // In a real implementation, this would analyze imports
    // to find which test files depend on the changed files
    const related: string[] = [];

    for (const file of changedFiles) {
      // If it's a test file itself, include it
      if (file.match(/\.(test|spec)\.(ts|js)$/)) {
        related.push(file);
      } else {
        // Find tests that import this file
        const testFile = file.replace(/\.(ts|js)$/, '.test.$1');
        related.push(testFile);
      }
    }

    return related;
  }

  private printWatchUsage(): void {
    console.log('\n' + '─'.repeat(80));
    console.log('\n🔍 Watch Usage:\n');
    console.log('  › Press a to run all tests');
    console.log('  › Press f to run only failed tests');
    console.log('  › Press o to run only tests related to changed files');
    console.log('  › Press u to update snapshots');
    console.log('  › Press q to quit\n');
  }
}

export class WatchPlugin {
  apply(hooks: any): void {
    hooks.onFileChange(async (changedFiles: Set<string>) => {
      console.log(`Files changed: ${Array.from(changedFiles).join(', ')}`);
    });

    hooks.onTestRunComplete(async (results: AggregatedResult) => {
      console.log(`Tests complete: ${results.numPassedTests} passed, ${results.numFailedTests} failed`);
    });
  }
}
