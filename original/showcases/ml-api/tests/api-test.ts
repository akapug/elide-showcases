/**
 * API Tests - Comprehensive Test Suite
 *
 * Tests for sentiment analysis API:
 * - Unit tests for individual components
 * - Integration tests for API endpoints
 * - Error handling tests
 * - Rate limiting tests
 * - Authentication tests
 * - Cache tests
 *
 * @module tests/api-test
 */

import { strict as assert } from 'assert';
import http from 'http';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_API_KEY = 'demo_free_key_123';

/**
 * Make HTTP request
 */
function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ statusCode: number; headers: any; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);

    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test suite
 */
class TestSuite {
  private passed: number = 0;
  private failed: number = 0;
  private tests: Array<{ name: string; status: 'pass' | 'fail'; error?: string }> = [];

  /**
   * Run a test
   */
  async test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.passed++;
      this.tests.push({ name, status: 'pass' });
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.tests.push({ name, status: 'fail', error: errorMessage });
      console.error(`✗ ${name}`);
      console.error(`  ${errorMessage}`);
    }
  }

  /**
   * Print summary
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log('='.repeat(60));

    if (this.failed > 0) {
      console.log('\nFailed Tests:');
      for (const test of this.tests) {
        if (test.status === 'fail') {
          console.log(`  - ${test.name}`);
          if (test.error) {
            console.log(`    ${test.error}`);
          }
        }
      }
    }
  }

  /**
   * Exit with appropriate code
   */
  exit(): void {
    process.exit(this.failed > 0 ? 1 : 0);
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<void> {
  const suite = new TestSuite();

  console.log('Running API Tests...\n');

  // Health check tests
  await suite.test('GET /health - returns 200', async () => {
    const res = await makeRequest('GET', '/health');
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.status);
    assert.equal(res.body.status, 'healthy');
  });

  await suite.test('GET /health - includes uptime', async () => {
    const res = await makeRequest('GET', '/health');
    assert.ok(res.body.uptime);
    assert.ok(res.body.uptimeFormatted);
  });

  await suite.test('GET /health - includes memory info', async () => {
    const res = await makeRequest('GET', '/health');
    assert.ok(res.body.memory);
    assert.ok(res.body.memory.heapUsed);
    assert.ok(res.body.memory.heapTotal);
  });

  // Metrics tests
  await suite.test('GET /metrics - returns 200', async () => {
    const res = await makeRequest('GET', '/metrics');
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.requests);
  });

  await suite.test('GET /metrics - includes request stats', async () => {
    const res = await makeRequest('GET', '/metrics');
    assert.ok(res.body.requests.total !== undefined);
    assert.ok(res.body.requests.success !== undefined);
    assert.ok(res.body.requests.error !== undefined);
  });

  // Root endpoint tests
  await suite.test('GET / - returns 200', async () => {
    const res = await makeRequest('GET', '/');
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.name);
    assert.ok(res.body.endpoints);
  });

  // Models endpoint tests
  await suite.test('GET /api/v1/models - returns 200', async () => {
    const res = await makeRequest('GET', '/api/v1/models');
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.models));
  });

  await suite.test('GET /api/v1/models - includes model info', async () => {
    const res = await makeRequest('GET', '/api/v1/models');
    const model = res.body.models[0];
    assert.ok(model.id);
    assert.ok(model.name);
    assert.ok(model.version);
  });

  // Authentication tests
  await suite.test('POST /api/v1/analyze - requires authentication', async () => {
    const res = await makeRequest('POST', '/api/v1/analyze', {
      text: 'This is a test',
    });
    assert.equal(res.statusCode, 401);
  });

  await suite.test('POST /api/v1/analyze - accepts API key in header', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is a test' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
  });

  await suite.test('POST /api/v1/analyze - accepts API key in Authorization header', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is a test' },
      { 'Authorization': `Bearer ${TEST_API_KEY}` }
    );
    assert.equal(res.statusCode, 200);
  });

  // Analyze endpoint tests
  await suite.test('POST /api/v1/analyze - analyzes positive sentiment', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is amazing! I love it!' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.sentiment, 'positive');
    assert.ok(res.body.score > 0);
  });

  await suite.test('POST /api/v1/analyze - analyzes negative sentiment', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is terrible! I hate it!' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.sentiment, 'negative');
    assert.ok(res.body.score < 0);
  });

  await suite.test('POST /api/v1/analyze - analyzes neutral sentiment', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is a book.' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.sentiment, 'neutral');
  });

  await suite.test('POST /api/v1/analyze - includes confidence score', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is great!' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.confidence !== undefined);
    assert.ok(res.body.confidence >= 0 && res.body.confidence <= 1);
  });

  await suite.test('POST /api/v1/analyze - includes processing time', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This is great!' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.processingTime !== undefined);
    assert.ok(res.body.processingTime > 0);
  });

  await suite.test('POST /api/v1/analyze - supports emotion detection', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'I am so happy!', includeEmotions: true },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.emotions !== undefined);
  });

  await suite.test('POST /api/v1/analyze - supports keyword extraction', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'This product is amazing and wonderful!', includeKeywords: true },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.keywords !== undefined);
    assert.ok(Array.isArray(res.body.keywords));
  });

  // Validation tests
  await suite.test('POST /api/v1/analyze - rejects empty text', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: '' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 400);
  });

  await suite.test('POST /api/v1/analyze - rejects missing text', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      {},
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 400);
  });

  await suite.test('POST /api/v1/analyze - rejects text that is too long', async () => {
    const longText = 'a'.repeat(10001);
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: longText },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 400);
  });

  // Batch endpoint tests
  await suite.test('POST /api/v1/batch - processes multiple texts', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/batch',
      {
        texts: [
          'This is great!',
          'This is terrible!',
          'This is okay.',
        ],
      },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.results));
    assert.equal(res.body.results.length, 3);
  });

  await suite.test('POST /api/v1/batch - includes summary statistics', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/batch',
      {
        texts: [
          'This is great!',
          'This is terrible!',
        ],
      },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.summary);
    assert.ok(res.body.summary.positive !== undefined);
    assert.ok(res.body.summary.negative !== undefined);
    assert.ok(res.body.summary.neutral !== undefined);
  });

  await suite.test('POST /api/v1/batch - rejects empty array', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/batch',
      { texts: [] },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 400);
  });

  await suite.test('POST /api/v1/batch - respects tier limits', async () => {
    const texts = Array(15).fill('This is a test');
    const res = await makeRequest(
      'POST',
      '/api/v1/batch',
      { texts },
      { 'X-API-Key': TEST_API_KEY } // free tier has limit of 10
    );
    assert.equal(res.statusCode, 400);
  });

  // Caching tests
  await suite.test('Caching - first request not cached', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'Cache test ' + Date.now() },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.cached, false);
  });

  await suite.test('Caching - second identical request is cached', async () => {
    const text = 'Cache test ' + Date.now();

    // First request
    await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text },
      { 'X-API-Key': TEST_API_KEY }
    );

    // Second request (should be cached)
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.cached, true);
  });

  // CORS tests
  await suite.test('CORS - includes Access-Control-Allow-Origin header', async () => {
    const res = await makeRequest('GET', '/health');
    assert.ok(res.headers['access-control-allow-origin']);
  });

  await suite.test('CORS - handles OPTIONS preflight', async () => {
    const res = await makeRequest('OPTIONS', '/api/v1/analyze');
    assert.equal(res.statusCode, 204);
    assert.ok(res.headers['access-control-allow-methods']);
  });

  // Rate limiting tests
  await suite.test('Rate limiting - includes rate limit headers', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      { text: 'Rate limit test' },
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.ok(res.headers['x-ratelimit-limit']);
    assert.ok(res.headers['x-ratelimit-remaining']);
    assert.ok(res.headers['x-ratelimit-reset']);
  });

  // Error handling tests
  await suite.test('Error handling - returns proper error format', async () => {
    const res = await makeRequest('GET', '/nonexistent');
    assert.equal(res.statusCode, 404);
    assert.ok(res.body.error);
    assert.ok(res.body.error.message);
    assert.ok(res.body.error.status);
  });

  await suite.test('Error handling - handles invalid JSON', async () => {
    const res = await makeRequest(
      'POST',
      '/api/v1/analyze',
      'invalid json',
      { 'X-API-Key': TEST_API_KEY }
    );
    assert.equal(res.statusCode, 400);
  });

  // Print summary
  suite.printSummary();
  suite.exit();
}

// Run tests
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests, makeRequest };
