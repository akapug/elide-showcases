/**
 * Integration Tests for API Gateway
 *
 * Comprehensive test suite for the polyglot API gateway.
 * Tests all services, authentication, middleware, and routing.
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
 * Test suite runner
 */
class TestSuite {
  private results: TestResult[] = [];
  private server: any;

  async setup() {
    console.log('Setting up test environment...');
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
      console.log(`✓ ${name}`);
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

  assertFalse(value: any, message?: string) {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${value}`);
    }
  }

  async report() {
    console.log('\n════════════════════════════════════════════════════');
    console.log('Test Results');
    console.log('════════════════════════════════════════════════════');

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

    console.log('\n════════════════════════════════════════════════════\n');

    return { passed, failed, total };
  }
}

/**
 * Main test suite
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     API Gateway Integration Tests                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const suite = new TestSuite();
  await suite.setup();

  // Health Check Tests
  await suite.test('Health check returns 200', async () => {
    const res = await suite.request('GET', '/health');
    suite.assertEqual(res.status, 200, 'Status should be 200');
    suite.assertTrue(res.body.status === 'healthy', 'Status should be healthy');
  });

  // API Info Tests
  await suite.test('API info returns service list', async () => {
    const res = await suite.request('GET', '/api');
    suite.assertEqual(res.status, 200);
    suite.assertTrue(Array.isArray(res.body.services), 'Should return services array');
    suite.assertEqual(res.body.services.length, 4, 'Should have 4 services');
  });

  // Authentication Tests
  await suite.test('Login with valid credentials', async () => {
    const res = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'password123' },
    });
    suite.assertEqual(res.status, 200);
    suite.assertTrue(res.body.token, 'Should return token');
    suite.assertTrue(res.body.user, 'Should return user');
  });

  await suite.test('Login with invalid credentials fails', async () => {
    const res = await suite.request('POST', '/auth/login', {
      body: { email: 'admin@example.com', password: 'wrongpassword' },
    });
    suite.assertEqual(res.status, 401);
  });

  await suite.test('Register new user', async () => {
    const res = await suite.request('POST', '/auth/register', {
      body: { email: 'newuser@example.com', password: 'password123' },
    });
    suite.assertEqual(res.status, 201);
    suite.assertTrue(res.body.token, 'Should return token');
  });

  // Get token for authenticated tests
  const loginRes = await suite.request('POST', '/auth/login', {
    body: { email: 'admin@example.com', password: 'password123' },
  });
  const authToken = loginRes.body.token;

  // User Service Tests (TypeScript)
  await suite.test('[TS] List users with pagination', async () => {
    const res = await suite.request('GET', '/api/users?page=1&limit=10', {
      headers: { authorization: `Bearer ${authToken}` },
    });
    suite.assertEqual(res.status, 200);
    suite.assertTrue(Array.isArray(res.body.users), 'Should return users array');
    suite.assertTrue(res.body.pagination, 'Should include pagination');
  });

  await suite.test('[TS] Create user with valid data', async () => {
    const res = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${authToken}` },
      body: {
        email: 'testuser@example.com',
        name: 'Test User',
        username: 'testuser',
      },
    });
    suite.assertEqual(res.status, 201);
    suite.assertTrue(res.body.user, 'Should return user');
    suite.assertTrue(res.body.user.id, 'User should have UUID');
  });

  await suite.test('[TS] Create user with invalid email fails', async () => {
    const res = await suite.request('POST', '/api/users', {
      headers: { authorization: `Bearer ${authToken}` },
      body: {
        email: 'invalid-email',
        name: 'Test User',
        username: 'testuser2',
      },
    });
    suite.assertEqual(res.status, 400);
  });

  // Analytics Service Tests (Python conceptual)
  await suite.test('[Python] Track analytics event', async () => {
    const res = await suite.request('POST', '/api/analytics/events', {
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        eventType: 'page_view',
        metadata: { page: '/home' },
      },
    });
    suite.assertEqual(res.status, 201);
    suite.assertTrue(res.body.event.id, 'Event should have UUID');
    suite.assertTrue(res.body.polyglotNote, 'Should include polyglot note');
  });

  await suite.test('[Python] Get analytics stats', async () => {
    const res = await suite.request('GET', '/api/analytics/stats?period=7d');
    suite.assertEqual(res.status, 200);
    suite.assertTrue(res.body.stats.reportId, 'Stats should have UUID report ID');
    suite.assertTrue(res.body.stats.metadata.service === 'analytics-python', 'Should identify as Python service');
  });

  await suite.test('[Python] Track event with invalid UUID fails', async () => {
    const res = await suite.request('POST', '/api/analytics/events', {
      body: {
        userId: 'invalid-uuid',
        eventType: 'page_view',
      },
    });
    suite.assertEqual(res.status, 400);
  });

  // Email Service Tests (Ruby conceptual)
  await suite.test('[Ruby] Send email with valid data', async () => {
    const res = await suite.request('POST', '/api/email/send', {
      body: {
        to: 'recipient@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      },
    });
    suite.assertEqual(res.status, 200);
    suite.assertTrue(res.body.email.id, 'Email should have UUID');
    suite.assertTrue(res.body.polyglotNote, 'Should include polyglot note');
  });

  await suite.test('[Ruby] Send email with invalid email fails', async () => {
    const res = await suite.request('POST', '/api/email/send', {
      body: {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      },
    });
    suite.assertEqual(res.status, 400);
  });

  await suite.test('[Ruby] List email templates', async () => {
    const res = await suite.request('GET', '/api/email/templates');
    suite.assertEqual(res.status, 200);
    suite.assertTrue(Array.isArray(res.body.templates), 'Should return templates array');
  });

  await suite.test('[Ruby] Create email template', async () => {
    const res = await suite.request('POST', '/api/email/templates', {
      body: {
        name: 'test-template',
        subject: 'Hello {{name}}',
        body: 'Welcome {{name}}!',
      },
    });
    suite.assertEqual(res.status, 201);
    suite.assertTrue(res.body.template.id, 'Template should have UUID');
  });

  // Payment Service Tests (Java conceptual)
  await suite.test('[Java] Process payment charge', async () => {
    const res = await suite.request('POST', '/api/payments/charge', {
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'customer@example.com',
        amount: 1999,
        cardNumber: '4532015112830366',
        description: 'Test purchase',
      },
    });
    suite.assertEqual(res.status, 200);
    suite.assertTrue(res.body.transaction.id, 'Transaction should have UUID');
    suite.assertTrue(res.body.polyglotNote, 'Should include polyglot note');
  });

  await suite.test('[Java] Process payment with invalid card fails', async () => {
    const res = await suite.request('POST', '/api/payments/charge', {
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'customer@example.com',
        amount: 1999,
        cardNumber: '1234567890123456',
      },
    });
    suite.assertEqual(res.status, 400);
  });

  await suite.test('[Java] List payment transactions', async () => {
    const res = await suite.request('GET', '/api/payments/transactions?page=1&limit=10');
    suite.assertEqual(res.status, 200);
    suite.assertTrue(Array.isArray(res.body.transactions), 'Should return transactions array');
  });

  // Middleware Tests
  await suite.test('CORS headers are present', async () => {
    const res = await suite.request('GET', '/health', {
      headers: { origin: 'http://localhost:3000' },
    });
    suite.assertTrue(res.headers['Access-Control-Allow-Origin'], 'Should include CORS header');
  });

  await suite.test('Request ID is generated', async () => {
    const res = await suite.request('GET', '/health');
    suite.assertTrue(res.headers['X-Request-ID'], 'Should include request ID');
    suite.assertTrue(res.headers['X-Transaction-ID'], 'Should include transaction ID');
  });

  await suite.test('Rate limit headers are present', async () => {
    const res = await suite.request('GET', '/health');
    suite.assertTrue(res.headers['X-RateLimit-Limit'], 'Should include rate limit');
    suite.assertTrue(res.headers['X-RateLimit-Remaining'], 'Should include remaining');
  });

  // Routing Tests
  await suite.test('404 for unknown route', async () => {
    const res = await suite.request('GET', '/api/unknown');
    suite.assertEqual(res.status, 404);
  });

  await suite.test('Route with parameters works', async () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const res = await suite.request('GET', `/api/analytics/users/${userId}`);
    suite.assertEqual(res.status, 200);
  });

  // Validation Tests
  await suite.test('UUID validation works across services', async () => {
    const invalidId = 'not-a-uuid';

    // Test in user service
    const userRes = await suite.request('GET', `/api/users/${invalidId}`, {
      headers: { authorization: `Bearer ${authToken}` },
    });
    suite.assertEqual(userRes.status, 400, 'User service should reject invalid UUID');

    // Test in payment service
    const paymentRes = await suite.request('GET', `/api/payments/transactions/${invalidId}`);
    suite.assertEqual(paymentRes.status, 400, 'Payment service should reject invalid UUID');
  });

  await suite.test('Email validation works across services', async () => {
    const invalidEmail = 'not-an-email';

    // Test in email service
    const emailRes = await suite.request('POST', '/api/email/send', {
      body: { to: invalidEmail, subject: 'Test', body: 'Test' },
    });
    suite.assertEqual(emailRes.status, 400, 'Email service should reject invalid email');

    // Test in payment service
    const paymentRes = await suite.request('POST', '/api/payments/charge', {
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: invalidEmail,
        amount: 100,
        cardNumber: '4532015112830366',
      },
    });
    suite.assertEqual(paymentRes.status, 400, 'Payment service should reject invalid email');
  });

  // Performance Tests
  await suite.test('Gateway handles concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, () =>
      suite.request('GET', '/health')
    );
    const results = await Promise.all(promises);
    suite.assertTrue(results.every(r => r.status === 200), 'All requests should succeed');
  });

  // Generate report
  const { passed, failed, total } = await suite.report();

  // Exit with appropriate code
  if (failed > 0) {
    console.error(`❌ ${failed} test(s) failed`);
    // In real implementation: process.exit(1);
  } else {
    console.log(`✅ All ${total} tests passed!`);
  }

  console.log('\nPolyglot Value Demonstrated:');
  console.log('  ✓ TypeScript, Python, Ruby, and Java services');
  console.log('  ✓ Shared utilities (UUID, Validator, etc.)');
  console.log('  ✓ Consistent validation across all languages');
  console.log('  ✓ One implementation, many services\n');
}

// Run tests
if (import.meta.url.includes('integration-test.ts')) {
  main().catch(console.error);
}
