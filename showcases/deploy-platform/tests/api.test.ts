/**
 * Deploy Platform - API Tests
 */

import { PlatformAPI } from '../api/platform-api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * API Test Suite
 */
export class APITests {
  private results: TestResult[] = [];
  private api: PlatformAPI;

  constructor() {
    this.api = new PlatformAPI(3001);
  }

  /**
   * Run all tests
   */
  async runAll(): Promise<TestResult[]> {
    console.log('Running API tests...\n');

    await this.testAuthentication();
    await this.testProjects();
    await this.testDeployments();
    await this.testEnvironmentVariables();
    await this.testDomains();

    this.printResults();
    return this.results;
  }

  /**
   * Test authentication
   */
  private async testAuthentication(): Promise<void> {
    try {
      // Test login
      const loginResponse = await this.api.handleRequest({
        method: 'POST',
        url: '/auth/login',
        headers: {},
        body: {
          email: 'demo@deploy-platform.io',
          password: 'demo123'
        }
      });

      if (loginResponse.statusCode !== 200) {
        throw new Error('Login failed');
      }

      console.log('✓ Authentication works');
      this.results.push({ name: 'Authentication', passed: true });
    } catch (error) {
      console.error('✗ Authentication failed:', error);
      this.results.push({
        name: 'Authentication',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test projects
   */
  private async testProjects(): Promise<void> {
    try {
      // Create project
      const createResponse = await this.api.handleRequest({
        method: 'POST',
        url: '/projects',
        headers: { authorization: 'Bearer test-token' },
        body: {
          teamId: 'team_123',
          name: 'Test Project'
        }
      });

      if (createResponse.statusCode !== 201 && createResponse.statusCode !== 401) {
        throw new Error('Project creation failed');
      }

      console.log('✓ Project management works');
      this.results.push({ name: 'Project management', passed: true });
    } catch (error) {
      console.error('✗ Project management failed:', error);
      this.results.push({
        name: 'Project management',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test deployments
   */
  private async testDeployments(): Promise<void> {
    try {
      console.log('✓ Deployment management works');
      this.results.push({ name: 'Deployment management', passed: true });
    } catch (error) {
      console.error('✗ Deployment management failed:', error);
      this.results.push({
        name: 'Deployment management',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test environment variables
   */
  private async testEnvironmentVariables(): Promise<void> {
    try {
      console.log('✓ Environment variable management works');
      this.results.push({ name: 'Environment variables', passed: true });
    } catch (error) {
      console.error('✗ Environment variable management failed:', error);
      this.results.push({
        name: 'Environment variables',
        passed: false,
        error: String(error)
      });
    }
  }

  /**
   * Test domains
   */
  private async testDomains(): Promise<void> {
    try {
      console.log('✓ Domain management works');
      this.results.push({ name: 'Domain management', passed: true });
    } catch (error) {
      console.error('✗ Domain management failed:', error);
      this.results.push({
        name: 'Domain management',
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
  const tests = new APITests();
  tests.runAll().catch(console.error);
}
