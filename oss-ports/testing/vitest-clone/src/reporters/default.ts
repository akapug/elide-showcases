/**
 * Vitest Clone - Default Reporter
 */

import type { Reporter, ReporterContext, File, TestCase } from '../types';

export class DefaultReporter implements Reporter {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  onInit(ctx: ReporterContext): void {
    console.log('\n⚡ Vitest Clone\n');
  }

  onPathsCollected(paths: string[]): void {
    console.log(`Found ${paths.length} test file(s)\n`);
  }

  onTestComplete(test: TestCase): void {
    const icon = test.result?.state === 'pass' ? '✓' : '✗';
    const color = test.result?.state === 'pass' ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${test.name}`);
  }

  onFinished(files: File[], errors: unknown[]): void {
    const total = files.reduce((sum, f) => sum + f.tasks.length, 0);
    const passed = files.reduce((sum, f) =>
      sum + f.tasks.filter(t => (t as TestCase).result?.state === 'pass').length, 0);
    const failed = total - passed;

    console.log(`\n${passed} passed | ${failed} failed | ${total} total\n`);
  }
}
