/**
 * Deploy Platform - Builder Tests
 */

import { BuildPipeline, BuildOrchestrator } from '../builder/build-pipeline';
import { CacheManager } from '../builder/cache-manager';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Builder Test Suite
 */
export class BuilderTests {
  private results: TestResult[] = [];

  /**
   * Run all tests
   */
  async runAll(): Promise<TestResult[]> {
    console.log('Running Builder tests...\n');

    await this.testBuildPipeline();
    await this.testCaching();
    await this.testBuildOrchestrator();

    this.printResults();
    return this.results;
  }

  /**
   * Test build pipeline
   */
  private async testBuildPipeline(): Promise<void> {
    try {
      const pipeline = new BuildPipeline();

      const result = await pipeline.build({
        deploymentId: 'test-deployment',
        projectPath: '/tmp/test-project',
        framework: 'nextjs',
        buildCommand: 'npm run build',
        installCommand: 'npm install',
        cacheEnabled: false
      });

      if (!result) {
        throw new Error('Build failed');
      }

      console.log('✓ Build pipeline works');
      this.results.push({ name: 'Build pipeline', passed: true });
    } catch (error) {
      console.error('✗ Build pipeline failed:', error);
      this.results.push({
        name: 'Build pipeline',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test caching
   */
  private async testCaching(): Promise<void> {
    try {
      const cache = new CacheManager('/tmp/test-cache');

      await cache.set('test-key', '/tmp/test-data', { test: 'metadata' });

      const cached = await cache.get('test-key');

      if (!cached) {
        throw new Error('Cache retrieval failed');
      }

      await cache.delete('test-key');

      console.log('✓ Build caching works');
      this.results.push({ name: 'Build caching', passed: true });
    } catch (error) {
      console.error('✗ Build caching failed:', error);
      this.results.push({
        name: 'Build caching',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test build orchestrator
   */
  private async testBuildOrchestrator(): Promise<void> {
    try {
      const orchestrator = new BuildOrchestrator();

      const result = await orchestrator.queueBuild({
        deploymentId: 'test-deployment-2',
        projectPath: '/tmp/test-project',
        framework: 'react',
        cacheEnabled: false
      });

      if (!result) {
        throw new Error('Build orchestration failed');
      }

      console.log('✓ Build orchestrator works');
      this.results.push({ name: 'Build orchestrator', passed: true });
    } catch (error) {
      console.error('✗ Build orchestrator failed:', error);
      this.results.push({
        name: 'Build orchestrator',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(50));
    console.log('Test Results');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`\nPassed: ${passed}/${total}`);

    if (passed === total) {
      console.log('\n✓ All tests passed!');
    } else {
      console.log('\n✗ Some tests failed:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tests = new BuilderTests();
  tests.runAll().catch(console.error);
}
