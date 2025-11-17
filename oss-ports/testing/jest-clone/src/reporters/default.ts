/**
 * Jest Clone - Default Reporter
 * Beautiful console output for test results
 */

import type { Reporter, Config, TestResult, AggregatedResult } from '../types';

export class DefaultReporter implements Reporter {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  onRunStart(config: Config): void {
    if (!this.config.silent) {
      console.log('\n🧪 Jest Clone Test Runner\n');
      console.log('Running tests...\n');
    }
  }

  onTestResult(result: TestResult): void {
    if (this.config.silent) return;

    const { testFilePath, numPassingTests, numFailingTests, perfStats } = result;

    if (this.config.verbose) {
      console.log(`\n${testFilePath}`);

      for (const test of result.testResults) {
        const icon = this.getStatusIcon(test.status);
        const duration = test.duration > 0 ? ` (${test.duration}ms)` : '';
        console.log(`  ${icon} ${test.fullName}${duration}`);

        if (test.status === 'failed' && test.failureMessages.length > 0) {
          for (const message of test.failureMessages) {
            console.log(`\n${this.formatError(message)}\n`);
          }
        }
      }
    } else {
      const status = numFailingTests > 0 ? '❌' : '✅';
      console.log(
        `${status} ${testFilePath} (${numPassingTests} passed, ${numFailingTests} failed, ${perfStats.runtime}ms)`
      );
    }
  }

  onRunComplete(results: AggregatedResult): void {
    if (this.config.silent) return;

    const {
      numTotalTests,
      numPassedTests,
      numFailedTests,
      numPendingTests,
      numTodoTests,
      startTime,
      endTime,
      success
    } = results;

    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 Test Summary\n');

    // Test counts
    console.log(`Total Tests:   ${numTotalTests}`);
    console.log(`✅ Passed:     ${numPassedTests}`);

    if (numFailedTests > 0) {
      console.log(`❌ Failed:     ${numFailedTests}`);
    }

    if (numPendingTests > 0) {
      console.log(`⏸️  Pending:    ${numPendingTests}`);
    }

    if (numTodoTests > 0) {
      console.log(`📝 Todo:       ${numTodoTests}`);
    }

    // Timing
    const duration = endTime - startTime;
    console.log(`\n⏱️  Duration:   ${this.formatDuration(duration)}`);

    // Test suites
    const numTestSuites = results.testResults.length;
    const passedSuites = results.testResults.filter(r => r.numFailingTests === 0).length;
    const failedSuites = numTestSuites - passedSuites;

    console.log(`\n📦 Test Suites: ${numTestSuites} total`);
    console.log(`   ✅ Passed:   ${passedSuites}`);
    if (failedSuites > 0) {
      console.log(`   ❌ Failed:   ${failedSuites}`);
    }

    // Failed tests detail
    if (numFailedTests > 0) {
      console.log('\n❌ Failed Tests:\n');
      for (const result of results.testResults) {
        const failedTests = result.testResults.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
          console.log(`  ${result.testFilePath}`);
          for (const test of failedTests) {
            console.log(`    • ${test.fullName}`);
          }
        }
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log(success ? '\n✅ All tests passed!\n' : '\n❌ Some tests failed.\n');
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏸️';
      case 'todo':
        return '📝';
      default:
        return '❓';
    }
  }

  private formatError(error: string): string {
    return error
      .split('\n')
      .map(line => `    ${line}`)
      .join('\n');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  }
}

export class VerboseReporter implements Reporter {
  private startTime = 0;

  onRunStart(): void {
    this.startTime = Date.now();
    console.log('\n🧪 Jest Clone - Verbose Mode\n');
  }

  onTestStart(result: TestResult): void {
    console.log(`\n▶️  Starting: ${result.testFilePath}`);
  }

  onTestResult(result: TestResult): void {
    const duration = Date.now() - this.startTime;
    console.log(`✓ Completed: ${result.testFilePath} (${duration}ms)`);
  }

  onRunComplete(results: AggregatedResult): void {
    const duration = results.endTime - results.startTime;
    console.log(`\n\n🏁 Completed in ${duration}ms`);
  }
}

export class JSONReporter implements Reporter {
  private results: AggregatedResult | null = null;

  onRunComplete(results: AggregatedResult): void {
    this.results = results;
    console.log(JSON.stringify(results, null, 2));
  }

  getResults(): AggregatedResult | null {
    return this.results;
  }
}

export class SummaryReporter implements Reporter {
  onRunComplete(results: AggregatedResult): void {
    const {
      numTotalTests,
      numPassedTests,
      numFailedTests,
      success
    } = results;

    const summary = [
      `Tests: ${numFailedTests} failed, ${numPassedTests} passed, ${numTotalTests} total`,
      `Status: ${success ? 'PASS' : 'FAIL'}`
    ].join(' | ');

    console.log(`\n${summary}\n`);
  }
}
