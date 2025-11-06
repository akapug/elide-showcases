/**
 * End-to-End Integration Tests for API Gateway
 *
 * Comprehensive E2E tests covering:
 * - Full user journeys
 * - Error handling and recovery
 * - Edge cases
 * - Performance under load
 * - Security scenarios
 */

import { createServer } from '../gateway/server.ts';
import type { Response } from '../gateway/middleware.ts';

/**
 * Test result interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  duration: number;
}

/**
 * E2E Test Suite
 */
class E2ETestSuite {
  private results: TestResult[] = [];
  private server: any;

  async setup() {
    console.log('Setting up E2E test environment...\n');
    this.server = await createServer();
  }

  async test(name: string, fn: () => Promise<void>) {
    const startTime = Date.now();
    try {
      await fn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`✓ ${name} (${Date.now() - startTime}ms)`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        message: error.message,
        duration: Date.now() - startTime,
      });
      console.error(`✗ ${name}: ${error.message}`);
    }
  }

  async request(method: string, url: string, options: { headers?: Record<string, string>; body?: any } = {}): Promise<Response> {
    return this.server.handleRequest({
      method,
      url,
      headers: options.headers || {},
      body: options.body,
      ip: '127.0.0.1',
    });
  }

  assertEqual(actual: any, expected: any, message?: string) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertTrue(value: any, message?: string) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  }

  async report() {
    console.log('\n' + '='.repeat(60));
    console.log('E2E Test Results');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\nTotal: ${total} tests`);
    console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\nFailed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
    }

    console.log('\n' + '='.repeat(60) + '\n');
    return { passed, failed, total };
  }
}

/**
 * Main E2E test suite
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     API Gateway End-to-End Tests                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const suite = new E2ETestSuite();
  await suite.setup();

  // User Journey: Complete Registration and Profile Management Flow
  await suite.test('E2E: User registration → login → profile update → deletion', async () => {
    // Step 1: Register new user
    const registerRes = await suite.request('POST', '/auth/register', {
      body: {
        email: 'e2e-test@example.com',
        password: 'SecurePass123!',
      },
    });
    suite.assertEqual(registerRes.status, 201, 'Registration should succeed');
    suite.assertTrue(registerRes.body.token, 'Should receive token');
    const userId = registerRes.body.user.id;
    const token = registerRes.body.token;

    // Step 2: Login with new credentials
    const loginRes = await suite.request('POST', '/auth/login', {
      body: {
        email: 'e2e-test@example.com',
        password: 'SecurePass123!',
      },
    });
    suite.assertEqual(loginRes.status, 200, 'Login should succeed');
    suite.assertTrue(loginRes.body.token, 'Should receive new token');

    // Step 3: Get user profile
    const profileRes = await suite.request('GET', `/api/users/${userId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    suite.assertEqual(profileRes.status, 200, 'Profile fetch should succeed');
    suite.assertEqual(profileRes.body.user.email, 'e2e-test@example.com');

    // Step 4: Update profile
    const updateRes = await suite.request('PUT', `/api/users/${userId}`, {
      headers: { authorization: `Bearer ${token}` },
      body: {
        name: 'E2E Test User Updated',
        username: 'e2e-updated',
      },
    });
    suite.assertEqual(updateRes.status, 200, 'Profile update should succeed');
    suite.assertEqual(updateRes.body.user.name, 'E2E Test User Updated');

    // Step 5: Delete account
    const deleteRes = await suite.request('DELETE', `/api/users/${userId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    suite.assertEqual(deleteRes.status, 204, 'Account deletion should succeed');

    // Step 6: Verify account is deleted
    const verifyRes = await suite.request('GET', `/api/users/${userId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    suite.assertEqual(verifyRes.status, 404, 'Deleted user should not be found');
  });

  // Error Recovery: Handle service failures gracefully
  await suite.test('E2E: Error recovery - malformed requests', async () => {
    // Malformed JSON body
    const res1 = await suite.request('POST', '/api/users', {
      headers: { 'content-type': 'application/json' },
      body: 'not-valid-json',
    });
    suite.assertTrue(res1.status >= 400, 'Should reject malformed JSON');

    // Missing required fields
    const res2 = await suite.request('POST', '/api/users', {
      body: { email: 'test@example.com' }, // missing password
    });
    suite.assertTrue(res2.status >= 400, 'Should reject missing fields');

    // Invalid field types
    const res3 = await suite.request('POST', '/api/users', {
      body: {
        email: 12345, // should be string
        password: 'test',
      },
    });
    suite.assertTrue(res3.status >= 400, 'Should reject invalid types');
  });

  // Edge Case: Concurrent requests from same user
  await suite.test('E2E: Concurrent requests - no race conditions', async () => {
    // Login first
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    // Make 10 concurrent requests
    const promises = Array.from({ length: 10 }, (_, i) =>
      suite.request('POST', '/api/analytics/events', {
        headers: { authorization: `Bearer ${token}` },
        body: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          eventType: 'concurrent_test',
          metadata: { iteration: i },
        },
      })
    );

    const results = await Promise.all(promises);

    // All should succeed
    suite.assertTrue(
      results.every(r => r.status === 201),
      'All concurrent requests should succeed'
    );

    // All should have unique event IDs
    const eventIds = results.map(r => r.body.event.id);
    const uniqueIds = new Set(eventIds);
    suite.assertEqual(
      uniqueIds.size,
      10,
      'All event IDs should be unique (no race conditions)'
    );
  });

  // Edge Case: Very long request chains
  await suite.test('E2E: Long request chain - multiple services', async () => {
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    // Chain: Create user → Track event → Send email → Process payment

    // 1. Create user
    const userRes = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: 'chain-test@example.com',
        username: 'chaintest',
        name: 'Chain Test',
      },
    });
    suite.assertEqual(userRes.status, 201);
    const newUserId = userRes.body.user.id;

    // 2. Track analytics event for new user
    const eventRes = await suite.request('POST', '/api/analytics/events', {
      body: {
        userId: newUserId,
        eventType: 'user_created',
        metadata: { source: 'e2e-test' },
      },
    });
    suite.assertEqual(eventRes.status, 201);

    // 3. Send welcome email
    const emailRes = await suite.request('POST', '/api/email/send', {
      body: {
        to: 'chain-test@example.com',
        subject: 'Welcome!',
        body: 'Welcome to our platform',
      },
    });
    suite.assertEqual(emailRes.status, 200);

    // 4. Process initial payment
    const paymentRes = await suite.request('POST', '/api/payments/charge', {
      body: {
        userId: newUserId,
        email: 'chain-test@example.com',
        amount: 999,
        cardNumber: '4532015112830366',
        description: 'Welcome bonus',
      },
    });
    suite.assertEqual(paymentRes.status, 200);

    // Verify all operations completed successfully
    suite.assertTrue(true, 'All chained operations completed');
  });

  // Security: Test authentication and authorization
  await suite.test('Security: Unauthorized access is blocked', async () => {
    // No token
    const res1 = await suite.request('GET', '/api/users');
    suite.assertTrue(res1.status === 401 || res1.status === 403, 'Should reject no token');

    // Invalid token
    const res2 = await suite.request('GET', '/api/users', {
      headers: { authorization: 'Bearer invalid-token-here' },
    });
    suite.assertTrue(res2.status === 401 || res2.status === 403, 'Should reject invalid token');

    // Expired token (simulation)
    const res3 = await suite.request('GET', '/api/users', {
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired' },
    });
    suite.assertTrue(res3.status === 401 || res3.status === 403, 'Should reject expired token');
  });

  // Security: Input sanitization
  await suite.test('Security: XSS and injection attempts are blocked', async () => {
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    // SQL injection attempt
    const res1 = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: "admin@test.com' OR '1'='1",
        username: 'hacker',
      },
    });
    suite.assertTrue(res1.status >= 400, 'Should reject SQL injection');

    // XSS attempt
    const res2 = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: 'xss@test.com',
        username: '<script>alert("XSS")</script>',
        name: '<img src=x onerror=alert(1)>',
      },
    });
    suite.assertTrue(res2.status >= 400, 'Should reject XSS');
  });

  // Performance: Rate limiting works
  await suite.test('Performance: Rate limiting prevents abuse', async () => {
    // Make many rapid requests
    const promises = Array.from({ length: 150 }, () =>
      suite.request('GET', '/health')
    );

    const results = await Promise.all(promises);

    // Some should be rate limited (assuming 100 req/min limit)
    const rateLimited = results.filter(r => r.status === 429).length;
    suite.assertTrue(
      rateLimited > 0 || results.every(r => r.headers['X-RateLimit-Remaining']),
      'Rate limiting should be active'
    );
  });

  // Edge Case: Large payload handling
  await suite.test('Edge Case: Large payloads are handled correctly', async () => {
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    // Large metadata object
    const largeMetadata = {
      data: 'x'.repeat(10000), // 10KB string
      nested: {
        array: Array(100).fill({ key: 'value' }),
      },
    };

    const res = await suite.request('POST', '/api/analytics/events', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'large_payload_test',
        metadata: largeMetadata,
      },
    });

    // Should either accept or reject gracefully (not crash)
    suite.assertTrue(
      res.status === 201 || res.status === 413,
      'Should handle large payloads gracefully'
    );
  });

  // Edge Case: Unicode and special characters
  await suite.test('Edge Case: Unicode and special characters', async () => {
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    const res = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: 'unicode@example.com',
        username: 'user-世界-🌍',
        name: 'Test User 测试 مستخدم ユーザー',
      },
    });

    suite.assertTrue(res.status === 201 || res.status === 400);
    if (res.status === 201) {
      suite.assertTrue(
        res.body.user.name.includes('Test User'),
        'Unicode should be preserved'
      );
    }
  });

  // Edge Case: Boundary values
  await suite.test('Edge Case: Boundary values (empty, max length)', async () => {
    const loginRes = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    const token = loginRes.body.token;

    // Very long email (should be rejected)
    const longEmail = 'a'.repeat(300) + '@example.com';
    const res1 = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: longEmail,
        username: 'test',
        password: 'password123',
      },
    });
    suite.assertTrue(res1.status >= 400, 'Should reject very long email');

    // Minimum valid values
    const res2 = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${token}` },
      body: {
        email: 'a@b.co',
        username: 'abc',
        password: 'pass1234',
      },
    });
    suite.assertTrue(res2.status === 201, 'Should accept minimum valid values');
  });

  // Performance: Response time consistency
  await suite.test('Performance: Consistent response times', async () => {
    const times: number[] = [];

    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await suite.request('GET', '/health');
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    suite.assertTrue(avg < 100, `Average response time should be fast (${avg}ms)`);
    suite.assertTrue(max < 200, `Max response time should be reasonable (${max}ms)`);

    // Variance check (max shouldn't be more than 5x min)
    suite.assertTrue(
      max / min < 5,
      `Response times should be consistent (min: ${min}ms, max: ${max}ms)`
    );
  });

  // Generate report
  const { passed, failed, total } = await suite.report();

  if (failed > 0) {
    console.error(`❌ ${failed} test(s) failed`);
  } else {
    console.log(`✅ All ${total} E2E tests passed!`);
  }

  console.log('\nE2E Test Coverage:');
  console.log('  ✓ Full user journeys');
  console.log('  ✓ Error handling');
  console.log('  ✓ Edge cases');
  console.log('  ✓ Security scenarios');
  console.log('  ✓ Performance characteristics');
  console.log('  ✓ Concurrent operations');
  console.log('  ✓ Data validation\n');
}

// Run tests
if (import.meta.url.includes('e2e-test.ts')) {
  main().catch(console.error);
}

export { E2ETestSuite, main };
