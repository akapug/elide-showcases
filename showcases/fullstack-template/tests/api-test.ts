/**
 * API Integration Tests
 * Tests for REST API endpoints
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class ApiTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  async test(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number; headers: Headers }> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    return {
      data: data as T,
      status: response.status,
      headers: response.headers,
    };
  }

  async runHealthTests(): Promise<void> {
    console.log('\n🏥 Testing Health Endpoints...\n');

    await this.test('GET /api/health should return 200', async () => {
      const { data, status } = await this.request<any>('/api/health');

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (!data.status || !data.timestamp) {
        throw new Error('Missing required fields in response');
      }
    });

    await this.test('GET /api/health/detailed should return metrics', async () => {
      const { data, status } = await this.request<any>('/api/health/detailed');

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (!data.database || !data.metrics) {
        throw new Error('Missing database or metrics in response');
      }
    });
  }

  async runUserTests(): Promise<void> {
    console.log('\n👥 Testing User Endpoints...\n');

    let createdUserId: string;

    await this.test('GET /api/users should return user list', async () => {
      const { data, status } = await this.request<any[]>('/api/users');

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (!Array.isArray(data)) {
        throw new Error('Response should be an array');
      }
    });

    await this.test('POST /api/users should create new user', async () => {
      const { data, status } = await this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      if (status !== 201) {
        throw new Error(`Expected 201, got ${status}`);
      }

      if (!data.id || !data.username || !data.email) {
        throw new Error('Missing required fields in created user');
      }

      createdUserId = data.id;
    });

    await this.test('POST /api/users should reject duplicate email', async () => {
      const { status } = await this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      if (status !== 409) {
        throw new Error(`Expected 409 (Conflict), got ${status}`);
      }
    });

    await this.test('GET /api/users/:id should return specific user', async () => {
      if (!createdUserId) {
        throw new Error('No user ID available');
      }

      const { data, status } = await this.request<any>(`/api/users/${createdUserId}`);

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (data.id !== createdUserId) {
        throw new Error('User ID mismatch');
      }
    });

    await this.test('PUT /api/users/:id should update user', async () => {
      if (!createdUserId) {
        throw new Error('No user ID available');
      }

      const { data, status } = await this.request<any>(`/api/users/${createdUserId}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: 'updateduser',
        }),
      });

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (data.username !== 'updateduser') {
        throw new Error('Username was not updated');
      }
    });

    await this.test('DELETE /api/users/:id should delete user', async () => {
      if (!createdUserId) {
        throw new Error('No user ID available');
      }

      const { status } = await this.request<any>(`/api/users/${createdUserId}`, {
        method: 'DELETE',
      });

      if (status !== 204) {
        throw new Error(`Expected 204, got ${status}`);
      }
    });

    await this.test('GET /api/users/:id should return 404 after deletion', async () => {
      if (!createdUserId) {
        throw new Error('No user ID available');
      }

      const { status } = await this.request<any>(`/api/users/${createdUserId}`);

      if (status !== 404) {
        throw new Error(`Expected 404, got ${status}`);
      }
    });
  }

  async runAuthTests(): Promise<void> {
    console.log('\n🔐 Testing Auth Endpoints...\n');

    await this.test('POST /api/auth/login with invalid credentials should fail', async () => {
      const { status } = await this.request<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        }),
      });

      if (status !== 401) {
        throw new Error(`Expected 401 (Unauthorized), got ${status}`);
      }
    });

    await this.test('POST /api/auth/login with demo user should succeed', async () => {
      const { data, status } = await this.request<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'demo',
        }),
      });

      if (status !== 200) {
        throw new Error(`Expected 200, got ${status}`);
      }

      if (!data.token || !data.user) {
        throw new Error('Missing token or user in response');
      }
    });
  }

  async runValidationTests(): Promise<void> {
    console.log('\n✅ Testing Validation...\n');

    await this.test('POST /api/users should reject invalid email', async () => {
      const { status } = await this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        }),
      });

      if (status !== 400) {
        throw new Error(`Expected 400 (Bad Request), got ${status}`);
      }
    });

    await this.test('POST /api/users should reject short password', async () => {
      const { status } = await this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'valid@example.com',
          password: '123',
        }),
      });

      if (status !== 400) {
        throw new Error(`Expected 400 (Bad Request), got ${status}`);
      }
    });

    await this.test('POST /api/users should reject short username', async () => {
      const { status } = await this.request<any>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'ab',
          email: 'valid@example.com',
          password: 'password123',
        }),
      });

      if (status !== 400) {
        throw new Error(`Expected 400 (Bad Request), got ${status}`);
      }
    });
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Running API Integration Tests...\n');
    console.log(`📍 Base URL: ${this.baseUrl}\n`);

    await this.runHealthTests();
    await this.runUserTests();
    await this.runAuthTests();
    await this.runValidationTests();

    this.printSummary();
  }

  printSummary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`✓ Success Rate: ${((passed / total) * 100).toFixed(2)}%`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     ${r.error}`);
        });
      console.log('');
    }
  }
}

// Run tests if executed directly
if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  const tester = new ApiTester();
  tester.runAllTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { ApiTester };
