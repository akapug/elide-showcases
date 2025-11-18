/**
 * Cross-Language Testing Examples
 *
 * Demonstrates how to test interactions between services written in
 * different languages using the Polyglot Testing Framework.
 */

import { describe, it, expect, beforeAll, afterAll } from '../src/assertion-library';
import { MockFramework } from '../src/mocking/mock-framework';
import { spawn } from 'child_process';
import axios from 'axios';

/**
 * Example 1: TypeScript calling Python service
 */
describe('TypeScript → Python Integration', () => {
  let pythonService: any;

  beforeAll(async () => {
    // Start Python service
    pythonService = spawn('python', ['services/python/app.py']);

    // Wait for service to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Stop Python service
    pythonService.kill();
  });

  it('should call Python data processing service', async () => {
    const response = await axios.post('http://localhost:5000/process', {
      data: [1, 2, 3, 4, 5],
      operation: 'sum'
    });

    expect(response.status).toBe(200);
    expect(response.data.result).toBe(15);
  });

  it('should handle Python service errors gracefully', async () => {
    try {
      await axios.post('http://localhost:5000/process', {
        data: 'invalid',
        operation: 'sum'
      });
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Invalid data type');
    }
  });

  it('should validate data transformation between TypeScript and Python', async () => {
    const tsData = {
      timestamp: new Date().toISOString(),
      values: [10, 20, 30],
      metadata: { source: 'typescript' }
    };

    const response = await axios.post('http://localhost:5000/transform', tsData);

    expect(response.data.metadata.source).toBe('typescript');
    expect(response.data.metadata.processedBy).toBe('python');
    expect(response.data.transformed).toBe(true);
  });
});

/**
 * Example 2: Python calling Ruby service
 */
describe('Python → Ruby Integration', () => {
  let rubyService: any;

  beforeAll(async () => {
    // Start Ruby service
    rubyService = spawn('ruby', ['services/ruby/server.rb']);
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    rubyService.kill();
  });

  it('should call Ruby analytics service from Python', async () => {
    // Simulate Python calling Ruby
    const response = await axios.post('http://localhost:4567/analyze', {
      events: [
        { type: 'click', timestamp: Date.now() },
        { type: 'view', timestamp: Date.now() + 1000 }
      ]
    });

    expect(response.status).toBe(200);
    expect(response.data.summary.totalEvents).toBe(2);
    expect(response.data.summary.eventTypes).toContain('click');
  });

  it('should handle Ruby service aggregation correctly', async () => {
    const response = await axios.post('http://localhost:4567/aggregate', {
      metrics: {
        impressions: 1000,
        clicks: 50,
        conversions: 5
      }
    });

    expect(response.data.ctr).toBeCloseTo(0.05, 2);
    expect(response.data.conversionRate).toBeCloseTo(0.005, 3);
  });
});

/**
 * Example 3: Java calling TypeScript service
 */
describe('Java → TypeScript Integration', () => {
  let tsService: any;

  beforeAll(async () => {
    // Start TypeScript service
    tsService = spawn('npm', ['run', 'start:service']);
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    tsService.kill();
  });

  it('should call TypeScript API from Java', async () => {
    const response = await axios.get('http://localhost:3000/api/users/123');

    expect(response.status).toBe(200);
    expect(response.data.id).toBe('123');
    expect(response.data.name).toBeDefined();
  });

  it('should handle TypeScript validation from Java requests', async () => {
    try {
      await axios.post('http://localhost:3000/api/users', {
        name: '', // Invalid - empty name
        email: 'invalid-email'
      });
    } catch (error: any) {
      expect(error.response.status).toBe(422);
      expect(error.response.data.errors).toHaveLength(2);
    }
  });
});

/**
 * Example 4: Cross-language mock testing
 */
describe('Cross-Language Mocking', () => {
  it('should mock Python service in TypeScript tests', async () => {
    const pythonMock = MockFramework.createMock({
      target: 'python-service',
      language: 'python',
      interface: {
        processData: {
          resolves: { result: 42, processingTime: 100 }
        },
        validateInput: {
          returns: true
        }
      },
      bridge: {
        host: 'localhost',
        port: 9876,
        protocol: 'http'
      }
    });

    const result = await pythonMock.processData([1, 2, 3]);
    expect(result.result).toBe(42);
    expect(result.processingTime).toBe(100);

    const isValid = pythonMock.validateInput({ data: 'test' });
    expect(isValid).toBe(true);

    expect(pythonMock.calls).toHaveLength(2);
  });

  it('should mock Ruby service with error scenarios', async () => {
    const rubyMock = MockFramework.createMock({
      target: 'ruby-analytics',
      language: 'ruby',
      interface: {
        analyze: {
          rejects: new Error('Analytics service unavailable')
        }
      }
    });

    await expect(rubyMock.analyze({ events: [] })).toReject(/unavailable/);
  });

  it('should mock Java service with complex responses', async () => {
    const javaMock = MockFramework.createMock({
      target: 'java-processor',
      language: 'java',
      interface: {
        processTransaction: {
          implementation: (transaction: any) => ({
            id: transaction.id,
            status: 'processed',
            timestamp: Date.now(),
            amount: transaction.amount * 1.1 // Add 10% fee
          })
        }
      }
    });

    const result = await javaMock.processTransaction({
      id: 'tx-123',
      amount: 100
    });

    expect(result.status).toBe('processed');
    expect(result.amount).toBe(110);
  });
});

/**
 * Example 5: Multi-service orchestration testing
 */
describe('Multi-Service Orchestration', () => {
  let services: Map<string, any>;

  beforeAll(async () => {
    services = new Map();

    // Start all services
    services.set('python', spawn('python', ['services/python/app.py']));
    services.set('ruby', spawn('ruby', ['services/ruby/server.rb']));
    services.set('java', spawn('java', ['-jar', 'services/java/app.jar']));

    // Wait for all services to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    // Stop all services
    for (const service of services.values()) {
      service.kill();
    }
  });

  it('should orchestrate workflow across all languages', async () => {
    // Step 1: TypeScript initiates request
    const initialData = { orderId: 'order-123', items: ['item1', 'item2'] };

    // Step 2: Python processes data
    const pythonResult = await axios.post('http://localhost:5000/process-order', initialData);
    expect(pythonResult.data.processed).toBe(true);

    // Step 3: Ruby performs analytics
    const rubyResult = await axios.post('http://localhost:4567/track-order', {
      orderId: pythonResult.data.orderId,
      metrics: pythonResult.data.metrics
    });
    expect(rubyResult.data.tracked).toBe(true);

    // Step 4: Java finalizes transaction
    const javaResult = await axios.post('http://localhost:8080/finalize', {
      orderId: pythonResult.data.orderId,
      analyticsId: rubyResult.data.analyticsId
    });
    expect(javaResult.data.status).toBe('completed');
  });

  it('should handle partial failures in orchestration', async () => {
    // Mock Ruby service failure
    const rubyMock = MockFramework.createMock({
      target: 'ruby-analytics',
      language: 'ruby',
      interface: {
        trackOrder: { throws: new Error('Analytics unavailable') }
      }
    });

    const initialData = { orderId: 'order-456', items: ['item3'] };

    // Python should succeed
    const pythonResult = await axios.post('http://localhost:5000/process-order', initialData);
    expect(pythonResult.data.processed).toBe(true);

    // Ruby should fail (using mock)
    try {
      await rubyMock.trackOrder({ orderId: pythonResult.data.orderId });
    } catch (error: any) {
      expect(error.message).toContain('Analytics unavailable');
    }

    // Java should handle gracefully with fallback
    const javaResult = await axios.post('http://localhost:8080/finalize', {
      orderId: pythonResult.data.orderId,
      analyticsId: null, // No analytics due to failure
      fallback: true
    });
    expect(javaResult.data.status).toBe('completed');
    expect(javaResult.data.analyticsSkipped).toBe(true);
  });
});

/**
 * Example 6: Cross-language event-driven testing
 */
describe('Event-Driven Communication', () => {
  it('should handle events across language boundaries', async () => {
    const events: any[] = [];

    // TypeScript publishes event
    await axios.post('http://localhost:3000/events/publish', {
      type: 'user.created',
      payload: { userId: 'user-123', name: 'John Doe' }
    });

    // Python subscriber receives event
    await new Promise(resolve => setTimeout(resolve, 1000));

    const pythonEvents = await axios.get('http://localhost:5000/events/received');
    expect(pythonEvents.data.events).toContain('user.created');

    // Ruby processes event
    const rubyStatus = await axios.get('http://localhost:4567/events/status');
    expect(rubyStatus.data.processed).toBeGreaterThan(0);

    // Java stores event
    const javaEvents = await axios.get('http://localhost:8080/events/stored');
    expect(javaEvents.data.count).toBeGreaterThan(0);
  });
});

/**
 * Example 7: Cross-language data consistency testing
 */
describe('Data Consistency Across Languages', () => {
  it('should maintain data consistency when passed between languages', async () => {
    const testData = {
      id: 'test-123',
      timestamp: new Date().toISOString(),
      values: [1.5, 2.7, 3.9],
      metadata: {
        precision: 2,
        unit: 'meters'
      }
    };

    // Send to Python
    const pythonResponse = await axios.post('http://localhost:5000/validate', testData);
    expect(pythonResponse.data.valid).toBe(true);
    expect(pythonResponse.data.data.id).toBe(testData.id);

    // Forward to Ruby
    const rubyResponse = await axios.post('http://localhost:4567/validate', pythonResponse.data.data);
    expect(rubyResponse.data.valid).toBe(true);
    expect(rubyResponse.data.data.values).toEqual(testData.values);

    // Forward to Java
    const javaResponse = await axios.post('http://localhost:8080/validate', rubyResponse.data.data);
    expect(javaResponse.data.valid).toBe(true);
    expect(javaResponse.data.data.metadata.precision).toBe(testData.metadata.precision);

    // Verify round-trip consistency
    expect(javaResponse.data.data).toEqual(testData);
  });
});

/**
 * Example 8: Performance testing across languages
 */
describe('Cross-Language Performance', () => {
  it('should measure response times across services', async () => {
    const iterations = 100;
    const timings: Record<string, number[]> = {
      typescript: [],
      python: [],
      ruby: [],
      java: []
    };

    for (let i = 0; i < iterations; i++) {
      // TypeScript
      const tsStart = Date.now();
      await axios.get('http://localhost:3000/ping');
      timings.typescript.push(Date.now() - tsStart);

      // Python
      const pyStart = Date.now();
      await axios.get('http://localhost:5000/ping');
      timings.python.push(Date.now() - pyStart);

      // Ruby
      const rbStart = Date.now();
      await axios.get('http://localhost:4567/ping');
      timings.ruby.push(Date.now() - rbStart);

      // Java
      const javaStart = Date.now();
      await axios.get('http://localhost:8080/ping');
      timings.java.push(Date.now() - javaStart);
    }

    // Calculate averages
    const averages = Object.entries(timings).reduce((acc, [lang, times]) => {
      acc[lang] = times.reduce((sum, t) => sum + t, 0) / times.length;
      return acc;
    }, {} as Record<string, number>);

    console.log('Average response times:', averages);

    // All services should respond within reasonable time
    for (const [lang, avg] of Object.entries(averages)) {
      expect(avg).toBeLessThan(100); // Less than 100ms average
    }
  });
});

/**
 * Example 9: Error propagation across services
 */
describe('Cross-Language Error Handling', () => {
  it('should propagate errors correctly across service boundaries', async () => {
    try {
      // TypeScript calls Python which calls Ruby which calls Java
      await axios.post('http://localhost:3000/chain/execute', {
        steps: ['python', 'ruby', 'java'],
        failAt: 'ruby' // Simulate failure at Ruby service
      });
    } catch (error: any) {
      expect(error.response.status).toBe(500);
      expect(error.response.data.failedAt).toBe('ruby');
      expect(error.response.data.trace).toBeDefined();
      expect(error.response.data.trace.length).toBe(2); // TypeScript -> Python -> Ruby (failed)
    }
  });

  it('should handle timeout errors in cross-service calls', async () => {
    try {
      await axios.post('http://localhost:3000/chain/execute', {
        steps: ['python', 'ruby', 'java'],
        timeout: 100 // Very short timeout
      }, {
        timeout: 150
      });
    } catch (error: any) {
      expect(error.code).toBe('ECONNABORTED');
    }
  });
});

/**
 * Example 10: Cross-language authentication and authorization
 */
describe('Cross-Language Auth Flow', () => {
  let authToken: string;

  it('should authenticate via TypeScript auth service', async () => {
    const response = await axios.post('http://localhost:3000/auth/login', {
      username: 'testuser',
      password: 'testpass'
    });

    expect(response.data.token).toBeDefined();
    authToken = response.data.token;
  });

  it('should validate token in Python service', async () => {
    const response = await axios.get('http://localhost:5000/protected', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.status).toBe(200);
    expect(response.data.authenticated).toBe(true);
  });

  it('should validate token in Ruby service', async () => {
    const response = await axios.get('http://localhost:4567/protected', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.status).toBe(200);
    expect(response.data.user).toBeDefined();
  });

  it('should validate token in Java service', async () => {
    const response = await axios.get('http://localhost:8080/protected', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.status).toBe(200);
    expect(response.data.authorized).toBe(true);
  });

  it('should reject invalid tokens across all services', async () => {
    const invalidToken = 'invalid.token.here';

    for (const [lang, port] of [['python', 5000], ['ruby', 4567], ['java', 8080]]) {
      try {
        await axios.get(`http://localhost:${port}/protected`, {
          headers: { Authorization: `Bearer ${invalidToken}` }
        });
      } catch (error: any) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.error).toContain('Invalid token');
      }
    }
  });
});
