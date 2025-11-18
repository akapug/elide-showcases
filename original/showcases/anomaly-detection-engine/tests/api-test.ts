/**
 * API endpoint tests.
 */

import { spawn } from 'child_process';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class APITester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Running API Tests...\n');

    await this.testHealthCheck();
    await this.testDetectSingle();
    await this.testDetectBatch();
    await this.testModelsList();
    await this.testAlertsList();
    await this.testStats();

    this.printResults();
  }

  async testHealthCheck(): Promise<void> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const data = await res.json();

      if (data.status === 'healthy') {
        this.pass('Health check', Date.now() - start);
      } else {
        this.fail('Health check', Date.now() - start, 'Status not healthy');
      }
    } catch (error: any) {
      this.fail('Health check', Date.now() - start, error.message);
    }
  }

  async testDetectSingle(): Promise<void> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: [1.5, 2.3, 0.8, 1.2, 3.1, 0.9, 2.7, 1.8, 2.2, 1.4]
        })
      });

      const data = await res.json();

      if (data.status === 'success' && data.result) {
        this.pass('Single event detection', Date.now() - start);
      } else {
        this.fail('Single event detection', Date.now() - start, 'Invalid response');
      }
    } catch (error: any) {
      this.fail('Single event detection', Date.now() - start, error.message);
    }
  }

  async testDetectBatch(): Promise<void> {
    const start = Date.now();

    try {
      const events = Array.from({ length: 10 }, (_, i) => ({
        features: Array.from({ length: 10 }, () => Math.random() * 5)
      }));

      const res = await fetch(`${this.baseUrl}/api/v1/detect/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });

      const data = await res.json();

      if (data.status === 'success' && data.result.results.length === 10) {
        this.pass('Batch detection', Date.now() - start);
      } else {
        this.fail('Batch detection', Date.now() - start, 'Invalid response');
      }
    } catch (error: any) {
      this.fail('Batch detection', Date.now() - start, error.message);
    }
  }

  async testModelsList(): Promise<void> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/models`);
      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.models)) {
        this.pass('List models', Date.now() - start);
      } else {
        this.fail('List models', Date.now() - start, 'Invalid response');
      }
    } catch (error: any) {
      this.fail('List models', Date.now() - start, error.message);
    }
  }

  async testAlertsList(): Promise<void> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/alerts`);
      const data = await res.json();

      if (data.status === 'success' && Array.isArray(data.alerts)) {
        this.pass('List alerts', Date.now() - start);
      } else {
        this.fail('List alerts', Date.now() - start, 'Invalid response');
      }
    } catch (error: any) {
      this.fail('List alerts', Date.now() - start, error.message);
    }
  }

  async testStats(): Promise<void> {
    const start = Date.now();

    try {
      const res = await fetch(`${this.baseUrl}/api/v1/stats/scorer`);
      const data = await res.json();

      if (data.status === 'success' && data.stats) {
        this.pass('Get statistics', Date.now() - start);
      } else {
        this.fail('Get statistics', Date.now() - start, 'Invalid response');
      }
    } catch (error: any) {
      this.fail('Get statistics', Date.now() - start, error.message);
    }
  }

  private pass(name: string, duration: number): void {
    this.results.push({ name, passed: true, duration });
  }

  private fail(name: string, duration: number, error: string): void {
    this.results.push({ name, passed: false, duration, error });
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    for (const result of this.results) {
      const status = result.passed ? '✓ PASS' : '✗ FAIL';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${status}${reset} ${result.name} (${result.duration}ms)`);

      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }

    console.log('='.repeat(80));
    console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(80));

    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(console.error);
