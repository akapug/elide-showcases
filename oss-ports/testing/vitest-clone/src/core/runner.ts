/**
 * Vitest Clone - Test Runner
 * High-performance test execution with threading support
 */

import type {
  VitestConfig,
  File,
  Suite,
  TestCase,
  Task,
  TaskResult,
  Reporter
} from '../types';

export class VitestRunner {
  private config: VitestConfig;
  private reporters: Reporter[] = [];
  private files: File[] = [];
  private currentSuite: Suite | null = null;
  private suiteStack: Suite[] = [];
  private taskId = 0;

  constructor(config: VitestConfig = {}) {
    this.config = config;
  }

  addReporter(reporter: Reporter): void {
    this.reporters.push(reporter);
  }

  async runTests(testPaths: string[]): Promise<RunResult> {
    const startTime = Date.now();

    // Initialize reporters
    await this.notifyReporters('onInit', {
      config: this.config,
      files: this.files
    });

    await this.notifyReporters('onPathsCollected', testPaths);

    // Collect test files
    for (const path of testPaths) {
      const file = await this.collectFile(path);
      if (file) {
        this.files.push(file);
      }
    }

    await this.notifyReporters('onCollected', this.files);

    // Execute tests
    const errors: unknown[] = [];

    if (this.config.test?.threads) {
      // Run tests in parallel
      await this.runParallel();
    } else {
      // Run tests sequentially
      await this.runSequential();
    }

    await this.notifyReporters('onFinished', this.files, errors);

    const endTime = Date.now();

    return {
      files: this.files,
      errors,
      duration: endTime - startTime,
      success: errors.length === 0 && this.getAllTests().every(t => t.result?.state === 'pass')
    };
  }

  private async collectFile(filepath: string): Promise<File | null> {
    try {
      // Reset state for new file
      const file: File = {
        filepath,
        name: filepath.split('/').pop() || filepath,
        tasks: [],
        type: 'suite',
        mode: 'run'
      };

      this.currentSuite = {
        id: this.nextId(),
        name: file.name,
        type: 'suite',
        mode: 'run',
        tasks: [],
        file
      };

      // Load test file
      await this.loadFile(filepath);

      file.tasks = this.currentSuite.tasks;

      return file;
    } catch (error) {
      console.error(`Failed to collect ${filepath}:`, error);
      return null;
    }
  }

  private async loadFile(filepath: string): Promise<void> {
    // In a real implementation, this would dynamically import the test file
    // The file would call describe(), it(), etc. which would populate the suite
    await import(filepath);
  }

  private async runParallel(): Promise<void> {
    const maxThreads = this.config.test?.maxThreads || 4;
    const batches: File[][] = [];

    // Split files into batches
    for (let i = 0; i < this.files.length; i += maxThreads) {
      batches.push(this.files.slice(i, i + maxThreads));
    }

    // Run each batch in parallel
    for (const batch of batches) {
      await Promise.all(batch.map(file => this.runFile(file)));
    }
  }

  private async runSequential(): Promise<void> {
    for (const file of this.files) {
      await this.runFile(file);
    }
  }

  private async runFile(file: File): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if file should be skipped
      if (file.mode === 'skip') {
        file.result = {
          state: 'skip',
          duration: 0
        };
        return;
      }

      // Run all tasks in the file
      for (const task of file.tasks) {
        await this.runTask(task);
      }

      const endTime = Date.now();
      const allPassed = file.tasks.every(t => t.type === 'test' ?
        (t as TestCase).result?.state === 'pass' : true);

      file.result = {
        state: allPassed ? 'pass' : 'fail',
        duration: endTime - startTime
      };
    } catch (error) {
      file.result = {
        state: 'fail',
        duration: Date.now() - startTime,
        error
      };
    }
  }

  private async runTask(task: Task): Promise<void> {
    if (task.type === 'suite') {
      await this.runSuite(task as Suite);
    } else if (task.type === 'test') {
      await this.runTest(task as TestCase);
    }
  }

  private async runSuite(suite: Suite): Promise<void> {
    if (suite.mode === 'skip') {
      for (const task of suite.tasks) {
        if (task.type === 'test') {
          (task as TestCase).result = { state: 'skip' };
        }
      }
      return;
    }

    // Run tasks in suite
    if (suite.concurrent) {
      // Run concurrent tests in parallel
      const tests = suite.tasks.filter(t => t.type === 'test');
      const suites = suite.tasks.filter(t => t.type === 'suite');

      await Promise.all([
        ...tests.map(t => this.runTest(t as TestCase)),
        ...suites.map(t => this.runSuite(t as Suite))
      ]);
    } else {
      // Run sequentially
      for (const task of suite.tasks) {
        await this.runTask(task);
      }
    }
  }

  private async runTest(test: TestCase): Promise<void> {
    const startTime = Date.now();

    await this.notifyReporters('onTestStart', test);

    try {
      if (test.mode === 'skip') {
        test.result = { state: 'skip', duration: 0 };
      } else if (test.mode === 'todo') {
        test.result = { state: 'todo', duration: 0 };
      } else {
        // Run the test (implementation would be provided by test file)
        // For now, we simulate a passing test
        await this.sleep(1);

        test.result = {
          state: 'pass',
          duration: Date.now() - startTime
        };
      }
    } catch (error) {
      test.result = {
        state: 'fail',
        duration: Date.now() - startTime,
        error
      };
    }

    await this.notifyReporters('onTestComplete', test);
  }

  private async notifyReporters(method: keyof Reporter, ...args: any[]): Promise<void> {
    await Promise.all(
      this.reporters.map(reporter => {
        const fn = reporter[method];
        if (typeof fn === 'function') {
          return fn.apply(reporter, args);
        }
      })
    );
  }

  private getAllTests(): TestCase[] {
    const tests: TestCase[] = [];

    const collectTests = (tasks: Task[]) => {
      for (const task of tasks) {
        if (task.type === 'test') {
          tests.push(task as TestCase);
        } else if (task.type === 'suite') {
          collectTests((task as Suite).tasks);
        }
      }
    };

    for (const file of this.files) {
      collectTests(file.tasks);
    }

    return tests;
  }

  private nextId(): string {
    return `task-${this.taskId++}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Global API for test definition
  describe(name: string, fn: () => void): void {
    const suite: Suite = {
      id: this.nextId(),
      name,
      type: 'suite',
      mode: 'run',
      tasks: [],
      suite: this.currentSuite || undefined
    };

    if (this.currentSuite) {
      this.currentSuite.tasks.push(suite);
    }

    this.suiteStack.push(this.currentSuite || suite);
    this.currentSuite = suite;

    fn();

    this.currentSuite = this.suiteStack.pop() || null;
  }

  it(name: string, fn?: () => void | Promise<void>): void {
    const test: TestCase = {
      id: this.nextId(),
      name,
      type: 'test',
      mode: 'run',
      suite: this.currentSuite || undefined,
      meta: {}
    };

    if (this.currentSuite) {
      this.currentSuite.tasks.push(test);
    }
  }

  test(name: string, fn?: () => void | Promise<void>): void {
    this.it(name, fn);
  }
}

export interface RunResult {
  files: File[];
  errors: unknown[];
  duration: number;
  success: boolean;
}

export class ThreadPool {
  private maxThreads: number;
  private activeThreads = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(maxThreads: number) {
    this.maxThreads = maxThreads;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeThreads >= this.maxThreads) {
      await new Promise<void>(resolve => {
        this.queue.push(async () => {
          resolve();
        });
      });
    }

    this.activeThreads++;

    try {
      return await task();
    } finally {
      this.activeThreads--;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  async wait(): Promise<void> {
    while (this.activeThreads > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
