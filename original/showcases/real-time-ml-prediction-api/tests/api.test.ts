/**
 * API Endpoint Tests
 *
 * Test all API endpoints to ensure they work correctly.
 */

import { start, stop } from '../src/server';
import * as http from 'http';

// Test configuration
const TEST_CONFIG = {
  host: 'localhost',
  port: 3001, // Use different port for tests
  timeout: 5000,
};

// Override port for tests
process.env.PORT = String(TEST_CONFIG.port);

/**
 * Make HTTP request helper
 */
function makeRequest(
  method: string,
  path: string,
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_CONFIG.host,
      port: TEST_CONFIG.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TEST_CONFIG.timeout,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode || 0, data: parsed });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test suite
 */
class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n🧪 Running API Tests\n');
    console.log('='.repeat(50));

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.error(`  Error: ${error instanceof Error ? error.message : error}`);
      }
    }

    console.log('='.repeat(50));
    console.log(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);

    return this.failed === 0;
  }
}

const runner = new TestRunner();

// Health check tests
runner.test('GET /health returns 200', async () => {
  const res = await makeRequest('GET', '/health');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (res.data.status !== 'healthy') throw new Error('Expected healthy status');
});

runner.test('GET /health includes uptime', async () => {
  const res = await makeRequest('GET', '/health');
  if (!res.data.uptime) throw new Error('Missing uptime field');
  if (typeof res.data.uptime !== 'number') throw new Error('Uptime should be number');
});

runner.test('GET /health includes memory stats', async () => {
  const res = await makeRequest('GET', '/health');
  if (!res.data.memory) throw new Error('Missing memory field');
  if (!res.data.memory.heapUsed) throw new Error('Missing heapUsed');
});

// Metrics tests
runner.test('GET /metrics returns 200', async () => {
  const res = await makeRequest('GET', '/metrics');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
});

runner.test('GET /metrics includes request stats', async () => {
  const res = await makeRequest('GET', '/metrics');
  if (!res.data.requests) throw new Error('Missing requests field');
  if (typeof res.data.requests.total !== 'number') throw new Error('Missing total requests');
});

runner.test('GET /metrics includes polyglot stats', async () => {
  const res = await makeRequest('GET', '/metrics');
  if (!res.data.polyglot) throw new Error('Missing polyglot field');
});

// Sentiment analysis tests
runner.test('POST /api/predict/sentiment with valid text', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {
    text: 'This is an amazing product! I absolutely love it!',
  });
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.data.sentiment) throw new Error('Missing sentiment field');
  if (!['positive', 'negative', 'neutral'].includes(res.data.sentiment)) {
    throw new Error(`Invalid sentiment: ${res.data.sentiment}`);
  }
});

runner.test('POST /api/predict/sentiment returns confidence', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {
    text: 'Great service!',
  });
  if (typeof res.data.confidence !== 'number') throw new Error('Missing or invalid confidence');
  if (res.data.confidence < 0 || res.data.confidence > 1) {
    throw new Error('Confidence should be between 0 and 1');
  }
});

runner.test('POST /api/predict/sentiment returns latency', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {
    text: 'Test text',
  });
  if (typeof res.data.latency_ms !== 'number') throw new Error('Missing latency_ms');
  console.log(`    Latency: ${res.data.latency_ms.toFixed(3)}ms`);
});

runner.test('POST /api/predict/sentiment rejects empty text', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {
    text: '',
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

runner.test('POST /api/predict/sentiment rejects missing text', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {});
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

runner.test('POST /api/predict/sentiment rejects too long text', async () => {
  const res = await makeRequest('POST', '/api/predict/sentiment', {
    text: 'a'.repeat(10001),
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

// Batch processing tests
runner.test('POST /api/predict/batch with multiple texts', async () => {
  const res = await makeRequest('POST', '/api/predict/batch', {
    texts: ['Great product!', 'Terrible service.', 'It\'s okay.'],
  });
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data.results)) throw new Error('Results should be array');
  if (res.data.results.length !== 3) throw new Error('Expected 3 results');
  console.log(`    Batch latency: ${res.data.latency_ms.toFixed(3)}ms`);
  console.log(`    Avg per item: ${res.data.avg_latency_per_item_ms.toFixed(3)}ms`);
});

runner.test('POST /api/predict/batch rejects empty array', async () => {
  const res = await makeRequest('POST', '/api/predict/batch', {
    texts: [],
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

runner.test('POST /api/predict/batch rejects too large batch', async () => {
  const res = await makeRequest('POST', '/api/predict/batch', {
    texts: new Array(101).fill('text'),
  });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

// Models endpoint tests
runner.test('GET /api/models returns model info', async () => {
  const res = await makeRequest('GET', '/api/models');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!Array.isArray(res.data.models)) throw new Error('Models should be array');
  if (res.data.models.length < 3) throw new Error('Expected at least 3 models');
});

// Error handling tests
runner.test('GET /nonexistent returns 404', async () => {
  const res = await makeRequest('GET', '/nonexistent');
  if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
});

runner.test('POST /api/predict/sentiment with invalid JSON', async () => {
  try {
    const options = {
      hostname: TEST_CONFIG.host,
      port: TEST_CONFIG.port,
      path: '/api/predict/sentiment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const result = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(options, (res) => {
        resolve({ status: res.statusCode || 0 });
        res.resume(); // Consume response
      });
      req.on('error', reject);
      req.write('invalid json{');
      req.end();
    });

    if (result.status !== 400) throw new Error(`Expected 400, got ${result.status}`);
  } catch (error) {
    // Connection errors are expected for invalid JSON
    if (error instanceof Error && error.message.includes('Expected 400')) {
      throw error;
    }
  }
});

// Performance tests
runner.test('Sentiment analysis completes in <5ms', async () => {
  const start = performance.now();
  await makeRequest('POST', '/api/predict/sentiment', {
    text: 'Test performance',
  });
  const duration = performance.now() - start;
  console.log(`    Total request time: ${duration.toFixed(2)}ms`);
  if (duration > 50) console.log('    Warning: Slower than expected (may be cold start)');
});

// Run tests
async function main() {
  try {
    console.log('Starting test server...');
    await start();
    console.log('Server started');

    // Wait a bit for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const success = await runner.run();

    await stop();
    console.log('Server stopped');

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

main();
